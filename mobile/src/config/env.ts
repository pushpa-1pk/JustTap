const resolveUrl = (url: string | undefined): string => {
  if (!url) return '';

  // Keep localhost unchanged for Expo Go on a physical device with adb reverse.
  // Android emulator users can set EXPO_PUBLIC_* URLs to http://10.0.2.2:<port>.
  return url;
};

export const ENV = {
  NODE_ENV: process.env.EXPO_PUBLIC_ENV || 'development',
  IS_DEV: (process.env.EXPO_PUBLIC_ENV || 'development') === 'development',
  
  // Microservices Base URLs
  AUTH_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_AUTH_SERVICE_URL) || 'http://127.0.0.1:4000',
  PROFILE_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_PROFILE_SERVICE_URL) || 'http://127.0.0.1:4001',
  SERVICE_MANAGEMENT_URL: resolveUrl(process.env.EXPO_PUBLIC_SERVICE_MANAGEMENT_URL) || 'http://127.0.0.1:4002',
  BOOKING_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_BOOKING_SERVICE_URL) || 'http://127.0.0.1:5000',
  MATCHING_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_MATCHING_SERVICE_URL) || 'http://127.0.0.1:5003',
  NOTIFICATION_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE_URL) || 'http://127.0.0.1:4005',
  PAYMENT_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_PAYMENT_SERVICE_URL) || 'http://127.0.0.1:5005',
  REVIEW_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_REVIEW_SERVICE_URL) || 'http://127.0.0.1:5006',
  TRACKING_SERVICE_URL: resolveUrl(process.env.EXPO_PUBLIC_TRACKING_SERVICE_URL) || 'http://127.0.0.1:5004',
  
  // Timeout settings
  REQUEST_TIMEOUT_MS: 15000,
  SOCKET_TIMEOUT_MS: 10000,
};

export default ENV;
