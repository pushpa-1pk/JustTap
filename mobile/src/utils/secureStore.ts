import * as SecureStore from 'expo-secure-store';

const KEY_ACCESS_TOKEN = 'justtap_access_token';
const KEY_REFRESH_TOKEN = 'justtap_refresh_token';
const KEY_USER_ROLE = 'justtap_user_role';

export const secureStore = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(KEY_REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Failed to save secure tokens:', error);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  },

  async saveRole(role: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_USER_ROLE, role);
    } catch (error) {
      console.error('Failed to save secure role:', error);
    }
  },

  async getRole(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_USER_ROLE);
    } catch (error) {
      console.error('Failed to retrieve secure role:', error);
      return null;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(KEY_USER_ROLE);
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  },
};
