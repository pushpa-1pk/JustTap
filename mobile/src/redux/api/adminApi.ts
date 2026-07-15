import { baseApi } from './baseApi';

export interface PendingProviderApproval {
  _id: string;
  userId: string;
  businessName: string;
  experience: number;
  workingRadius: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface BookingAnalytics {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Provider Approvals (Profile Service)
    getPendingApprovals: builder.query<{ success: boolean; data: PendingProviderApproval[] }, void>({
      query: () => ({
        url: '/admin/pending-approvals',
        method: 'GET',
      }),
      providesTags: ['Profile'],
    }),
    approveProvider: builder.mutation<{ success: boolean; message: string }, string>({
      query: (requestId) => ({
        url: `/admin/approvals/${requestId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Profile'],
    }),
    rejectProvider: builder.mutation<{ success: boolean; message: string }, { requestId: string; remarks: string }>({
      query: ({ requestId, remarks }) => ({
        url: `/admin/approvals/${requestId}/reject`,
        method: 'POST',
        data: { remarks },
      }),
      invalidatesTags: ['Profile'],
    }),

    // 2. Catalog Management (Service Management Service)
    createCategory: builder.mutation<{ success: boolean; data: any }, { name: string; slug: string; description: string; isActive: boolean }>({
      query: (body) => ({
        url: '/admin/categories',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Categories'],
    }),
    createService: builder.mutation<{ success: boolean; data: any }, { categoryId: string; name: string; slug: string; description: string; estimatedDuration: number; isActive: boolean }>({
      query: (body) => ({
        url: '/admin/services',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Services'],
    }),

    // 3. Analytics (Booking Service)
    getAdminBookingAnalytics: builder.query<{ success: boolean; data: BookingAnalytics }, void>({
      query: () => ({
        url: '/admin/bookings/analytics',
        method: 'GET',
      }),
      providesTags: ['Bookings'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPendingApprovalsQuery,
  useApproveProviderMutation,
  useRejectProviderMutation,
  useCreateCategoryMutation,
  useCreateServiceMutation,
  useGetAdminBookingAnalyticsQuery,
} = adminApi;
