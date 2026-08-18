import apiClient from '../config/axios';

export const jobApi = {
  async acceptJob(invitationId: string) {
    const response = await apiClient.post(`/booking-requests/${invitationId}/accept`);
    return response.data;
  },

  async rejectJob(invitationId: string) {
    const response = await apiClient.post(`/booking-requests/${invitationId}/reject`);
    return response.data;
  }
};
