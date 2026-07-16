import { baseApi } from './baseApi';

export interface Review {
  _id: string;
  bookingId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  tags: string[];
  createdAt: string;
  reviewerSnapshot?: {
    fullName: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: string]: number;
  };
}

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createReview: builder.mutation<{ success: boolean; data: Review }, { bookingId: string; providerId: string; serviceId: string; rating: number; title?: string; comment?: string; images?: string[]; tags?: string[] }>({
      query: (body) => ({
        url: '/reviews',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Bookings'],
    }),
    getProviderReviews: builder.query<{ success: boolean; data: Review[] }, string>({
      query: (providerId) => ({
        url: `/public/provider/${providerId}`,
        method: 'GET',
      }),
    }),
    getProviderReviewSummary: builder.query<{ success: boolean; data: ReviewSummary }, string>({
      query: (providerId) => ({
        url: `/public/summary/provider/${providerId}`,
        method: 'GET',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateReviewMutation,
  useGetProviderReviewsQuery,
  useGetProviderReviewSummaryQuery,
} = reviewApi;
