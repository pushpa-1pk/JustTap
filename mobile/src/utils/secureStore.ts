import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_ACCESS_TOKEN = 'justtap_access_token';
const KEY_REFRESH_TOKEN = 'justtap_refresh_token';
const KEY_USER_ROLE = 'justtap_user_role';

const isWeb = Platform.OS === 'web';

const browserStore = {
  async setItemAsync(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  async getItemAsync(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

const storage = isWeb ? browserStore : SecureStore;

export const secureStore = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await storage.setItemAsync(KEY_ACCESS_TOKEN, accessToken);
      await storage.setItemAsync(KEY_REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Failed to save secure tokens:', error);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await storage.getItemAsync(KEY_ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await storage.getItemAsync(KEY_REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  },

  async saveRole(role: string): Promise<void> {
    try {
      await storage.setItemAsync(KEY_USER_ROLE, role);
    } catch (error) {
      console.error('Failed to save secure role:', error);
    }
  },

  async getRole(): Promise<string | null> {
    try {
      return await storage.getItemAsync(KEY_USER_ROLE);
    } catch (error) {
      console.error('Failed to retrieve secure role:', error);
      return null;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await storage.deleteItemAsync(KEY_ACCESS_TOKEN);
      await storage.deleteItemAsync(KEY_REFRESH_TOKEN);
      await storage.deleteItemAsync(KEY_USER_ROLE);
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  },
};
