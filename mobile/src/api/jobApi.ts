import apiClient from '../config/axios';

export const jobApi = {
  async acceptJob(invitationId: string) {
    try {
      const response = await apiClient.post(`/booking-requests/${invitationId}/accept`);
      return response.data;
    } catch (err: any) {
      console.warn('Matching service accept failed, attempting direct booking-service assignment confirm:', err?.response?.data || err.message);
      // Fallback directly to Booking Service
      const fallbackResponse = await apiClient.patch(`/bookings/provider/${invitationId}/accept`);
      return fallbackResponse.data;
    }
  },

  async rejectJob(invitationId: string) {
    try {
      const response = await apiClient.post(`/booking-requests/${invitationId}/reject`);
      return response.data;
    } catch (err: any) {
      console.warn('Matching service reject failed, attempting direct booking-service cancel:', err?.response?.data || err.message);
      const fallbackResponse = await apiClient.post(`/bookings/${invitationId}/cancel`, {
        reasonCode: 'PROVIDER_REJECTED',
        customExplanation: 'Provider declined incoming job offer'
      });
      return fallbackResponse.data;
    }
  }
};
