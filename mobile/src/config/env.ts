import { Platform } from 'react-native';

const resolveUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // In development, Android emulator needs 10.0.2.2 instead of localhost
  if (__DEV__ && Platform.OS === 'android') {
    return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  
  return url;
};

export const ENV = {
  NODE_ENV: process.env.EXPO_PUBLIC_ENV || 'development',
  IS_DEV: (process.env.EXPO_PUBLIC_ENV || 'development') === 'development',
  
  // Microservices Base URLs
  AUTH_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_AUTH_SERVICE_URL) || 'http://localhost:4000',
  PROFILE_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_PROFILE_SERVICE_URL) || 'http://localhost:4001',
  SERVICE_MANAGEMENT_URL: resolveUrl(process.env.EXPO_PUBLIC_SERVICE_MANAGEMENT_URL) || 'http://localhost:4002',
  BOOKING_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_BOOKING_SERVICE_URL) || 'http://localhost:3001',
  MATCHING_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_MATCHING_SERVICE_URL) || 'http://localhost:5003',
  NOTIFICATION_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE_URL) || 'http://localhost:4005',
  PAYMENT_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_PAYMENT_SERVICE_URL) || 'http://localhost:5005',
  REVIEW_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_REVIEW_SERVICE_URL) || 'http://localhost:5006',
  TRACKING_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_TRACKING_SERVICE_URL) || 'http://localhost:5004',
  
  // Timeout settings
  REQUEST_TIMEOUT_MS: 15000,
  SOCKET_TIMEOUT_MS: 10000,
};

export default ENV;
