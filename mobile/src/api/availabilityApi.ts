import apiClient from '../config/axios';

export const availabilityApi = {
  async setAvailability(isOnline: boolean) {
    const response = await apiClient.put('/profiles/provider/online-status', { isOnline });
    return response.data;
  }
};
