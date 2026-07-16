import { Platform } from 'react-native';

export type AppUserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export type ApiUserRole = 'customer' | 'provider' | 'admin';
export type AuthPlatform = 'ANDROID' | 'IOS' | 'WEB';

export const getAuthPlatform = (): AuthPlatform => {
  if (Platform.OS === 'android') {
    return 'ANDROID';
  }

  if (Platform.OS === 'ios') {
    return 'IOS';
  }

  return 'WEB';
};

export const normalizeUserRole = (role: string | null | undefined): AppUserRole => {
  const normalized = String(role || '').trim().toUpperCase();

  if (normalized === 'PROVIDER') {
    return 'PROVIDER';
  }

  if (normalized === 'ADMIN') {
    return 'ADMIN';
  }

  return 'CUSTOMER';
};

export const normalizeProfileCompletion = (value: {
  isProfileComplete?: boolean;
  profileCompleted?: boolean;
} | null | undefined): boolean => {
  return Boolean(value?.isProfileComplete ?? value?.profileCompleted ?? false);
};
