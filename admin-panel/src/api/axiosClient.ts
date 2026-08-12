import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URLS, ENDPOINTS } from './apiConfig';

// In-memory token store for security
let accessTokenInMemory: string | null = null;

export const getAccessToken = () => {
  if (accessTokenInMemory) return accessTokenInMemory;
  return localStorage.getItem('justtap_access_token');
};

export const setAccessToken = (token: string | null) => {
  accessTokenInMemory = token;
  if (token) {
    localStorage.setItem('justtap_access_token', token);
  } else {
    localStorage.removeItem('justtap_access_token');
  }
};

export const getRefreshToken = () => {
  return localStorage.getItem('justtap_refresh_token');
};

export const setRefreshToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('justtap_refresh_token', token);
  } else {
    localStorage.removeItem('justtap_refresh_token');
  }
};

export const getRememberMe = () => {
  return localStorage.getItem('justtap_remember_me') === 'true';
};

export const setRememberMe = (value: boolean) => {
  localStorage.setItem('justtap_remember_me', String(value));
};

// Queue for replaying requests after token refresh completes
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

// Create axios instance
const axiosClient: AxiosInstance = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach bearer token and device information
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Inject headers required by backend microservices
    if (config.headers) {
      config.headers['X-Device-ID'] = 'admin-web-client-1';
      config.headers['X-Platform'] = 'WEB';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Manage token rotation and standard error traps
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    if (!error.response) {
      return Promise.reject(new Error('Network connectivity issue. Please check your network connection.'));
    }

    const { status } = error.response;

    // Handle 401 Unauthorized (Expired Tokens)
    if (status === 401 && !originalRequest._retry) {
      // If we are already refreshing, push this request to the queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        handleSessionTimeout();
        return Promise.reject(error);
      }

      try {
        // Execute Refresh Token API call against the Auth gateway
        const response = await axios.post(`${API_BASE_URLS.auth}${ENDPOINTS.auth.refreshToken}`, {
          refreshToken,
          deviceId: 'admin-web-client-1',
          deviceName: 'Admin Dashboard Web',
          platform: 'WEB',
          appVersion: '1.0.0',
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data?.data || {};

        if (newAccessToken) {
          setAccessToken(newAccessToken);
          if (newRefreshToken) {
            setRefreshToken(newRefreshToken);
          }
          
          processQueue(null, newAccessToken);
          isRefreshing = false;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosClient(originalRequest);
        } else {
          throw new Error('Refresh response body was invalid.');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        handleSessionTimeout();
        return Promise.reject(refreshError);
      }
    }

    // Handle 429 Too Many Requests (Rate Limits)
    if (status === 429) {
      // Dispatch alert or reject with clear message
      console.warn('API Rate limit encountered. Throttling requests.');
      return Promise.reject(new Error('Request limit reached. Please wait a moment before trying again.'));
    }

    // Pass on other errors (403 Forbidden, 404 Not Found, 500 Server Error)
    return Promise.reject(error);
  }
);

// Session clearance
export const handleSessionTimeout = () => {
  setAccessToken(null);
  setRefreshToken(null);
  localStorage.removeItem('justtap_user');
  
  // Dispatch dynamic event that App.tsx can subscribe to
  window.dispatchEvent(new Event('justtap_auth_session_timeout'));
};

export default axiosClient;
