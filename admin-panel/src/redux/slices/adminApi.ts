import { baseApi } from '../baseApi';
import { API_BASE_URLS } from '../../api/apiConfig';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // USER MANAGEMENT
    // ==========================================
    getCustomers: builder.query<any, { search?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: '/profiles/customer', // Adjust if mapped to admin query in profile service
        baseUrlOverride: API_BASE_URLS.profiles,
        params,
      }),
      providesTags: ['User'],
      transformResponse: (response: any) => response.data || response,
    }),
    
    updateUserStatus: builder.mutation<any, { userId: string; status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' }>({
      query: ({ userId, status }) => ({
        url: `/admin/users/${userId}/status`, // Mock endpoint path resolved locally by gateway
        baseUrlOverride: API_BASE_URLS.profiles,
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: ['User'],
    }),

    // ==========================================
    // PROVIDER MANAGEMENT & KYC
    // ==========================================
    getProviders: builder.query<any, { search?: string; status?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: '/profiles/provider',
        baseUrlOverride: API_BASE_URLS.profiles,
        params,
      }),
      providesTags: ['Provider'],
      transformResponse: (response: any) => response.data || response,
    }),

    approveProviderRequest: builder.mutation<any, { approvalRequestId: string }>({
      query: ({ approvalRequestId }) => ({
        url: `/admin/approvals/${approvalRequestId}/approve`,
        baseUrlOverride: API_BASE_URLS.profiles,
        method: 'POST',
      }),
      invalidatesTags: ['Provider'],
    }),

    rejectProviderRequest: builder.mutation<any, { approvalRequestId: string; reason: string }>({
      query: ({ approvalRequestId, reason }) => ({
        url: `/admin/approvals/${approvalRequestId}/reject`,
        baseUrlOverride: API_BASE_URLS.profiles,
        method: 'POST',
        data: { reason },
      }),
      invalidatesTags: ['Provider'],
    }),

    verifyProviderDocument: builder.mutation<any, { documentId: string; status: 'VERIFIED' | 'REJECTED'; remarks?: string }>({
      query: ({ documentId, status, remarks }) => ({
        url: `/admin/documents/${documentId}/verify`,
        baseUrlOverride: API_BASE_URLS.profiles,
        method: 'POST',
        data: { status, remarks },
      }),
      invalidatesTags: ['Provider'],
    }),

    // ==========================================
    // CATEGORY & SERVICE MANAGEMENT
    // ==========================================
    getCategories: builder.query<any, { includeInactive?: boolean; page?: number; limit?: number }>({
      query: (params) => ({
        url: '/admin/categories',
        baseUrlOverride: API_BASE_URLS.services,
        params,
      }),
      providesTags: ['Category'],
      transformResponse: (response: any) => response.data || response,
    }),

    createCategory: builder.mutation<any, { name: string; slug: string; description: string; isActive?: boolean }>({
      query: (data) => ({
        url: '/admin/categories',
        baseUrlOverride: API_BASE_URLS.services,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Category'],
    }),

    updateCategory: builder.mutation<any, { categoryId: string; name?: string; slug?: string; description?: string; isActive?: boolean }>({
      query: ({ categoryId, ...data }) => ({
        url: `/admin/categories/${categoryId}`,
        baseUrlOverride: API_BASE_URLS.services,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Category'],
    }),

    deleteCategory: builder.mutation<any, string>({
      query: (categoryId) => ({
        url: `/admin/categories/${categoryId}`,
        baseUrlOverride: API_BASE_URLS.services,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),

    getServices: builder.query<any, { categoryId?: string; keyword?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: '/admin/services',
        baseUrlOverride: API_BASE_URLS.services,
        params,
      }),
      providesTags: ['Service'],
      transformResponse: (response: any) => response.data || response,
    }),

    createService: builder.mutation<any, { categoryId: string; name: string; slug: string; description: string; estimatedDuration: number; isActive?: boolean }>({
      query: (data) => ({
        url: '/admin/services',
        baseUrlOverride: API_BASE_URLS.services,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Service'],
    }),

    updateService: builder.mutation<any, { serviceId: string; categoryId?: string; name?: string; slug?: string; description?: string; estimatedDuration?: number; isActive?: boolean }>({
      query: ({ serviceId, ...data }) => ({
        url: `/admin/services/${serviceId}`,
        baseUrlOverride: API_BASE_URLS.services,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Service'],
    }),

    deleteService: builder.mutation<any, string>({
      query: (serviceId) => ({
        url: `/admin/services/${serviceId}`,
        baseUrlOverride: API_BASE_URLS.services,
        method: 'DELETE',
      }),
      invalidatesTags: ['Service'],
    }),

    // Custom skills moderation
    getCustomSkills: builder.query<any, { status?: 'PENDING' | 'APPROVED' | 'REJECTED'; page?: number; limit?: number }>({
      query: (params) => ({
        url: '/admin/custom-skills',
        baseUrlOverride: API_BASE_URLS.services,
        params,
      }),
      providesTags: ['CustomSkill'],
      transformResponse: (response: any) => response.data || response,
    }),

    approveCustomSkill: builder.mutation<any, { customSkillId: string; adminRemarks?: string }>({
      query: ({ customSkillId, adminRemarks }) => ({
        url: `/admin/custom-skills/${customSkillId}/approve`,
        baseUrlOverride: API_BASE_URLS.services,
        method: 'POST',
        data: { adminRemarks },
      }),
      invalidatesTags: ['CustomSkill', 'Service'],
    }),

    rejectCustomSkill: builder.mutation<any, { customSkillId: string; adminRemarks?: string }>({
      query: ({ customSkillId, adminRemarks }) => ({
        url: `/admin/custom-skills/${customSkillId}/reject`,
        baseUrlOverride: API_BASE_URLS.services,
        method: 'POST',
        data: { adminRemarks },
      }),
      invalidatesTags: ['CustomSkill'],
    }),

    // ==========================================
    // BOOKING MANAGEMENT
    // ==========================================
    getBookingsList: builder.query<any, { page?: number; limit?: number; status?: string; bookingNumber?: string }>({
      query: (params) => ({
        url: '/admin/bookings/search',
        baseUrlOverride: API_BASE_URLS.bookings,
        params,
      }),
      providesTags: ['Booking'],
      transformResponse: (response: any) => response.data || response,
    }),

    manuallyAssignProvider: builder.mutation<any, { bookingId: string; providerId: string; businessName: string; phone: string }>({
      query: ({ bookingId, ...providerData }) => ({
        url: `/admin/bookings/${bookingId}/assign-provider`,
        baseUrlOverride: API_BASE_URLS.bookings,
        method: 'POST',
        data: providerData,
      }),
      invalidatesTags: ['Booking'],
    }),

    cancelBooking: builder.mutation<any, { bookingId: string; reasonCode: string; customExplanation?: string }>({
      query: ({ bookingId, ...cancelData }) => ({
        url: `/bookings/${bookingId}/cancel`,
        baseUrlOverride: API_BASE_URLS.bookings,
        method: 'POST',
        data: cancelData,
      }),
      invalidatesTags: ['Booking'],
    }),

    rescheduleBooking: builder.mutation<any, { bookingId: string; newStartTime: string; newEndTime: string; reasonCode: string; customExplanation?: string }>({
      query: ({ bookingId, ...rescheduleData }) => ({
        url: `/bookings/${bookingId}/reschedule`,
        baseUrlOverride: API_BASE_URLS.bookings,
        method: 'POST',
        data: rescheduleData,
      }),
      invalidatesTags: ['Booking'],
    }),

    // ==========================================
    // PAYMENTS & WALLET LEDGER
    // ==========================================
    triggerClawbackRefund: builder.mutation<any, { paymentId: string; amount: number; reason: string }>({
      query: (refundData) => ({
        url: '/payments/refunds',
        baseUrlOverride: API_BASE_URLS.payments,
        method: 'POST',
        data: refundData,
      }),
      invalidatesTags: ['Payment', 'Wallet'],
    }),

    getCustomerWalletInfo: builder.query<any, { customerId: string }>({
      query: ({ customerId }) => ({
        url: `/payments/wallet/customer`, // Resolves wallet context for given customer
        baseUrlOverride: API_BASE_URLS.payments,
        params: { customerId },
      }),
      providesTags: ['Wallet'],
      transformResponse: (response: any) => response.data || response,
    }),

    adjustWalletBalance: builder.mutation<any, { type: 'CREDIT' | 'DEBIT'; targetRole: 'customer' | 'provider'; id: string; amount: number; description: string }>({
      query: (data) => ({
        url: `/payments/wallet/adjust`, // Handled by centralized ledger proxy endpoint in dev
        baseUrlOverride: API_BASE_URLS.payments,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Wallet'],
    }),

    // ==========================================
    // REVIEWS MODERATION
    // ==========================================
    getAbuseReports: builder.query<any, void>({
      query: () => ({
        url: '/admin/moderation/reports',
        baseUrlOverride: API_BASE_URLS.reviews,
      }),
      providesTags: ['Review'],
      transformResponse: (response: any) => response.data || response,
    }),

    moderateReview: builder.mutation<any, { reviewId: string; action: 'HIDE' | 'DELETE' | 'DISMISS'; reason?: string }>({
      query: ({ reviewId, action, reason }) => ({
        url: `/admin/moderation/reviews/${reviewId}`,
        baseUrlOverride: API_BASE_URLS.reviews,
        method: 'PATCH',
        data: { action, reason },
      }),
      invalidatesTags: ['Review'],
    }),

    // ==========================================
    // CUSTOMER SUPPORT HELPDESK
    // ==========================================
    getSupportTickets: builder.query<any[], void>({
      query: () => ({
        url: '/support/tickets',
        baseUrlOverride: API_BASE_URLS.profiles,
      }),
      providesTags: ['SupportTicket'],
      transformResponse: (response: any) => response.data || response,
    }),

    replyToTicket: builder.mutation<any, { ticketId: string; text: string; sender: 'ADMIN' | 'SUPPORT_AGENT' }>({
      query: ({ ticketId, text, sender }) => ({
        url: `/support/tickets/${ticketId}/reply`,
        baseUrlOverride: API_BASE_URLS.profiles,
        method: 'POST',
        data: { text, sender },
      }),
      invalidatesTags: ['SupportTicket'],
    }),

    // ==========================================
    // AUDIT LOG INDEX
    // ==========================================
    getAuditLogs: builder.query<any, { search?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: '/admin/audit-logs', // Mock endpoint resolved locally by gateway
        baseUrlOverride: API_BASE_URLS.auth,
        params,
      }),
      providesTags: ['AuditLog'],
      transformResponse: (response: any) => response.data || response,
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useUpdateUserStatusMutation,
  useGetProvidersQuery,
  useApproveProviderRequestMutation,
  useRejectProviderRequestMutation,
  useVerifyProviderDocumentMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetCustomSkillsQuery,
  useApproveCustomSkillMutation,
  useRejectCustomSkillMutation,
  useGetBookingsListQuery,
  useManuallyAssignProviderMutation,
  useCancelBookingMutation,
  useRescheduleBookingMutation,
  useTriggerClawbackRefundMutation,
  useGetCustomerWalletInfoQuery,
  useAdjustWalletBalanceMutation,
  useGetAbuseReportsQuery,
  useModerateReviewMutation,
  useGetSupportTicketsQuery,
  useReplyToTicketMutation,
  useGetAuditLogsQuery,
} = adminApi;
