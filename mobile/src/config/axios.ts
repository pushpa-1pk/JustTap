import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from './env';
import { secureStore } from '../utils/secureStore';
import { getAuthPlatform } from '../utils/auth';

// Helper to resolve microservice endpoint based on path prefixes
export const getAbsoluteUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Health checks
  if (url === '/auth-health') return `${ENV.AUTH_SERVICE_URL}/api/v1/health`;
  if (url === '/profile-health') return `${ENV.PROFILE_SERVICE_URL}/api/v1/health`;
  if (url === '/service-health') return `${ENV.SERVICE_MANAGEMENT_URL}/api/v1/health`;
  if (url === '/booking-health') return `${ENV.BOOKING_SERVICE_URL}/health`;
  if (url === '/matching-health') return `${ENV.MATCHING_SERVICE_URL}/health`;

  // Auth Service
  if (url.startsWith('/auth')) {
    return `${ENV.AUTH_SERVICE_URL}/api/v1${url}`;
  }
  
  // Profile Service
  if (
    url.startsWith('/profiles') || 
    url.startsWith('/addresses') || 
    url.startsWith('/documents') || 
    url.startsWith('/bank-details') ||
    url.startsWith('/admin/pending-approvals') ||
    url.startsWith('/admin/approvals') ||
    url.startsWith('/admin/documents')
  ) {
    return `${ENV.PROFILE_SERVICE_URL}/api/v1${url}`;
  }
  
  // Service Management Service
  if (
    url.startsWith('/categories') || 
    url.startsWith('/services') || 
    url.startsWith('/provider/services') || 
    url.startsWith('/provider/custom-skills') ||
    url.startsWith('/admin/categories') || 
    url.startsWith('/admin/services') || 
    url.startsWith('/admin/custom-skills') ||
    url.startsWith('/search/providers') // service catalog search
  ) {
    return `${ENV.SERVICE_MANAGEMENT_URL}/api/v1${url}`;
  }
  
  // Booking Service
  if (
    url.startsWith('/bookings') || 
    url.startsWith('/admin/bookings')
  ) {
    return `${ENV.BOOKING_SERVICE_URL}/api/v1${url}`;
  }
  
  // Notification Service
  if (
    url.startsWith('/notifications') ||
    url.startsWith('/preferences') ||
    url.startsWith('/devices/register')
  ) {
    return `${ENV.NOTIFICATION_SERVICE_URL}/api/v1${url}`;
  }

  // Payment Service
  if (
    url.startsWith('/payments') ||
    url.startsWith('/wallet') ||
    url.startsWith('/withdrawals') ||
    url.startsWith('/methods') ||
    url.startsWith('/coupons') ||
    url.startsWith('/invoices')
  ) {
    return `${ENV.PAYMENT_SERVICE_URL}/api/v1${url}`;
  }

  // Review Service
  if (
    url.startsWith('/reviews') ||
    url.startsWith('/public/provider') ||
    url.startsWith('/public/summary')
  ) {
    return `${ENV.REVIEW_SERVICE_URL}/api/v1${url}`;
  }

  // Matching Service (Discovery / Sockets)
  if (
    url.startsWith('/search/providers-matching') || // matching-service specific search
    url.startsWith('/booking-requests') || 
    url.startsWith('/provider/status') || 
    url.startsWith('/provider/location')
  ) {
    // Rename matching search prefix to avoid conflict with service-management
    const cleanUrl = url.replace('/search/providers-matching', '/search/providers');
    return `${ENV.MATCHING_SERVICE_URL}/api/v1${cleanUrl}`;
  }
  
  return url;
};

// Create Axios Instance
const apiClient = axios.create({
  timeout: ENV.REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Inject JWT and resolve absolute URL
apiClient.interceptors.request.use(
  async (config) => {
    // Resolve full absolute URL from microservice endpoint mapper
    if (config.url) {
      config.url = getAbsoluteUrl(config.url);
    }
    
    // Inject Access Token from Secure Store
    const token = await secureStore.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Refresh on 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStore.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call Auth Service directly to refresh token
        // Use raw axios to avoid interceptor loop
        const refreshUrl = getAbsoluteUrl('/auth/refresh-token');
        const refreshResponse = await axios.post(refreshUrl, {
          refreshToken,
          deviceId: await secureStore.getDeviceId(),
          deviceName: 'JustTap Mobile',
          platform: getAuthPlatform(),
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
        
        // Save new tokens
        await secureStore.saveTokens(newAccessToken, newRefreshToken);
        const { store } = require('../redux/store');
        const currentUser = store.getState()?.auth?.user;
        if (currentUser) {
          await secureStore.saveUser(currentUser);
        }
        
        // Resume queued requests
        processQueue(null, newAccessToken);
        
        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clean tokens on failure and trigger logout redirect
        await secureStore.clearAll();
        
        // Dispatch logout event through Redux after clearing the invalid session.
        const { store } = require('../redux/store');
        const { logout } = require('../redux/slices/authSlice');
        if (store && logout) {
          store.dispatch(logout());
        }

        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
