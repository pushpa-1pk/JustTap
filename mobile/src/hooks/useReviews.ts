import { useQuery } from '@tanstack/react-query';
import apiClient from '../config/axios';
import { store } from '../redux/store';

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

const isDemoUser = () => {
  try {
    const state = store.getState();
    return Boolean(state.auth.user?.id?.startsWith('demo-'));
  } catch {
    return false;
  }
};

const DEMO_REVIEWS: Review[] = [
  {
    _id: 'demo-review-1',
    bookingId: 'demo-booking-1',
    customerId: 'demo-user-9999999999',
    providerId: 'demo-provider-1',
    serviceId: 'service-cleaning-1',
    rating: 5,
    title: 'Excellent Work!',
    comment: 'The cleaning team was extremely polite and professional. Highly recommended!',
    images: [],
    tags: ['cleaning', 'professional'],
    status: 'APPROVED',
    createdAt: '2026-08-04T12:00:00.000Z',
  },
];

export function useGetCustomerReviews(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['reviews', { page, limit }],
    queryFn: async () => {
      if (isDemoUser()) {
        return {
          docs: DEMO_REVIEWS,
          total: DEMO_REVIEWS.length,
          page: 1,
          pages: 1,
        };
      }
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
