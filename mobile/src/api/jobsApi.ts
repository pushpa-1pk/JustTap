import apiClient from '../config/axios';
import { JobStatus } from '../types/job';

export const jobsApi = {
  async getProviderJobs(params: {
    status: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    // Upcoming/Active requests (retrieved from active jobs feed)
    if (params.status === 'UPCOMING' || params.status === 'ACTIVE') {
      const response = await apiClient.get('/bookings/provider/active', {
        params: {
          page: params.page || 1,
          limit: params.limit || 50,
        }
      });
      return response.data;
    }

    // Completed/Cancelled jobs (retrieved from historical past logs)
    const statusQuery = params.status === 'ALL' ? undefined : params.status;
    const response = await apiClient.get('/bookings/provider/history', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        status: statusQuery,
        search: params.search || undefined
      }
    });
    return response.data;
  },

  async getProviderJob(jobId: string) {
    const response = await apiClient.get(`/bookings/provider/${jobId}`);
    return response.data;
  },

  async cancelProviderJob(jobId: string, reason: string) {
    const response = await apiClient.post(`/bookings/${jobId}/cancel`, {
      reasonCode: reason,
      customExplanation: reason,
    });
    return response.data;
  },

  async updateJobStatus(jobId: string, newStatus: JobStatus) {
    const response = await apiClient.patch(`/bookings/${jobId}/status`, {
      nextStatus: newStatus,
    });
    return response.data;
  }
};
export default jobsApi;
