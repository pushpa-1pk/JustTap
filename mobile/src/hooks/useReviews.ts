import { useQuery } from '@tanstack/react-query';
import apiClient from '../config/axios';

export interface Review {
  _id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  tags: string[];
  status: string;
  createdAt: string;
}

export function useGetCustomerReviews(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['reviews', { page, limit }],
    queryFn: async () => {
      const response = await apiClient.get('/reviews/history', {
        params: { page, limit },
      });
      return response.data as {
        docs: Review[];
        total: number;
        page: number;
        pages: number;
      };
    },
  });
}
