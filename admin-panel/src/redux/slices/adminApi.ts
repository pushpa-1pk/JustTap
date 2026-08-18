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

    approveProviderRequest: builder.mutation<any, { approvalRequestId: string; feedback?: string }>({
      query: ({ approvalRequestId, feedback }) => ({
        url: `/admin/approvals/${approvalRequestId}/approve`,
        baseUrlOverride: API_BASE_URLS.profiles,
        method: 'POST',
        data: { feedback },
      }),
      invalidatesTags: ['Provider'],
    }),

    rejectProviderRequest: builder.mutation<any, { approvalRequestId: string; reason: string }>({
      query: ({ approvalRequestId, reason }) => ({
        url: `/admin/approvals/${approvalRequestId}/reject`,
        baseUrlOverride: API_BASE_URLS.profiles,
        method: 'POST',
        data: { rejectionReason: reason },
      }),
      invalidatesTags: ['Provider'],
    }),

    getApprovalDetails: builder.query<any, string>({
      query: (approvalRequestId) => ({
        url: `/admin/approvals/${approvalRequestId}`,
        baseUrlOverride: API_BASE_URLS.profiles,
      }),
      providesTags: ['Provider'],
      transformResponse: (response: any) => response.data || response,
    }),

    verifyProviderDocument: builder.mutation<any, { documentId: string; isApproved: boolean; rejectionReason?: string }>({
      query: ({ documentId, isApproved, rejectionReason }) => ({
        url: `/admin/documents/${documentId}/verify`,
        baseUrlOverride: API_BASE_URLS.profiles,
        method: 'POST',
        data: { isApproved, rejectionReason },
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

    createCategory: builder.mutation<any, { name: string; slug: string; description: string; icon?: string; isActive?: boolean }>({
      query: (data) => ({
        url: '/admin/categories',
        baseUrlOverride: API_BASE_URLS.services,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Category'],
    }),

    updateCategory: builder.mutation<any, { categoryId: string; name?: string; slug?: string; description?: string; icon?: string; isActive?: boolean }>({
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

    getDisputesList: builder.query<any[], { status?: string }>({
      async queryFn({ status }) {
        const list = [
          {
            _id: 'disp_001',
            disputeNumber: 'DISP-2026-001',
            bookingId: 'book_001',
            bookingNumber: 'JT-2026-9028',
            reasonCategory: 'POOR_SERVICE_QUALITY',
            disputeStatus: 'OPEN',
            priorityLevel: 'HIGH',
            customerName: 'Anita Sharma',
            providerBusiness: 'Fast Electric Works',
            bookingAmount: 599,
            createdAt: '2026-08-11T09:00:00.000Z',
            description: 'The technician damaged my wall socket while mounting the new switchboard. I want a refund for repairs.',
            messages: [
              { sender: 'CUSTOMER', text: 'Technician damaged the wall socket during work. I want ₹500 for wall repair.', timestamp: '2026-08-11T09:00:00.000Z', isInternal: false },
              { sender: 'PROVIDER', text: 'The wall socket was already cracked before we touched it. We did not cause this.', timestamp: '2026-08-11T10:15:00.000Z', isInternal: false },
              { sender: 'SUPPORT_AGENT', text: 'Looking into this. Requesting provider to upload pre-work photos.', timestamp: '2026-08-11T11:00:00.000Z', isInternal: false },
              { sender: 'ADMIN', text: 'Customer uploaded a clear photo showing fresh cracks. Heavy damage is visible.', timestamp: '2026-08-11T11:15:00.000Z', isInternal: true }
            ]
          },
          {
            _id: 'disp_002',
            disputeNumber: 'DISP-2026-002',
            bookingId: 'book_002',
            bookingNumber: 'JT-2026-9029',
            reasonCategory: 'PROVIDER_NO_SHOW',
            disputeStatus: 'RESOLVED',
            priorityLevel: 'MEDIUM',
            customerName: 'Rohan Mehra',
            providerBusiness: 'A-1 Cleaning Solutions',
            bookingAmount: 439,
            createdAt: '2026-08-10T14:30:00.000Z',
            description: 'Nobody turned up for the scheduled deep cleaning session, but my wallet was debited.',
            messages: [
              { sender: 'CUSTOMER', text: 'Nobody arrived. Please refund ₹439.', timestamp: '2026-08-10T14:30:00.000Z', isInternal: false }
            ]
          }
        ];
        const filtered = status ? list.filter(d => d.disputeStatus === status) : list;
        return { data: filtered };
      }
    }),

    resolveDispute: builder.mutation<any, { disputeId: string; resolutionType: 'REFUND_CUSTOMER' | 'PAY_PROVIDER' | 'SPLIT_PAYMENT' | 'NO_PAYOUT'; refundAmount?: number; adminRemarks?: string }>({
      query: ({ disputeId, ...data }) => ({
        url: `/admin/bookings/disputes/${disputeId}/resolve`,
        baseUrlOverride: API_BASE_URLS.bookings,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Booking', 'Payment', 'Wallet'],
    }),

    getDisputeThread: builder.query<any, { disputeId: string }>({
      async queryFn({ disputeId }) {
        const threadMap: Record<string, any> = {
          'disp_001': [
            { sender: 'CUSTOMER', text: 'Technician damaged the wall socket during work. I want ₹500 for wall repair.', timestamp: '2026-08-11T09:00:00.000Z', isInternal: false },
            { sender: 'PROVIDER', text: 'The wall socket was already cracked before we touched it. We did not cause this.', timestamp: '2026-08-11T10:15:00.000Z', isInternal: false },
            { sender: 'SUPPORT_AGENT', text: 'Looking into this. Requesting provider to upload pre-work photos.', timestamp: '2026-08-11T11:00:00.000Z', isInternal: false },
            { sender: 'ADMIN', text: 'Customer uploaded a clear photo showing fresh cracks. Heavy damage is visible.', timestamp: '2026-08-11T11:15:00.000Z', isInternal: true }
          ],
          'disp_002': [
            { sender: 'CUSTOMER', text: 'Nobody arrived. Please refund ₹439.', timestamp: '2026-08-10T14:30:00.000Z', isInternal: false }
          ]
        };
        return { data: threadMap[disputeId] || [] };
      }
    }),

    sendDisputeMessage: builder.mutation<any, { disputeId: string; messageText: string; isInternal?: boolean }>({
      query: ({ disputeId, ...data }) => ({
        url: `/admin/bookings/disputes/${disputeId}/messages`,
        baseUrlOverride: API_BASE_URLS.bookings,
        method: 'POST',
        data,
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
      async queryFn() {
        return {
          data: [
            {
              _id: 'tkt_001',
              subject: 'Refund request delayed',
              category: 'PAYMENT',
              status: 'OPEN',
              createdAt: '2026-08-12T05:00:00.000Z',
              userPhone: '+919876543210',
              userName: 'Anita Sharma',
              messages: [
                { sender: 'CUSTOMER', text: 'I requested a refund for booking JT-9028, but it is not visible in my bank account yet.', timestamp: '2026-08-12T05:00:00.000Z' },
                { sender: 'SUPPORT_AGENT', text: 'Let me look into the Razorpay refund reference status for you.', timestamp: '2026-08-12T05:30:00.000Z' }
              ]
            },
            {
              _id: 'tkt_002',
              subject: 'Cannot upload trade license PDF',
              category: 'VERIFICATION',
              status: 'OPEN',
              createdAt: '2026-08-12T06:15:00.000Z',
              userPhone: '+919890123456',
              userName: 'Fast Electric Works',
              messages: [
                { sender: 'PROVIDER', text: 'The verification upload keeps throwing a file size limit exception when submitting my PDF documents.', timestamp: '2026-08-12T06:15:00.000Z' }
              ]
            },
            {
              _id: 'tkt_003',
              subject: 'Account blocked status query',
              category: 'ACCOUNT',
              status: 'CLOSED',
              createdAt: '2026-08-10T12:00:00.000Z',
              userPhone: '+919988776655',
              userName: 'Rohan Mehra',
              messages: [
                { sender: 'CUSTOMER', text: 'Why is my account showing suspended?', timestamp: '2026-08-10T12:00:00.000Z' },
                { sender: 'ADMIN', text: 'Your account was flagged for multiple consecutive dispute claims. It has been re-activated after review.', timestamp: '2026-08-10T14:00:00.000Z' }
              ]
            }
          ]
        };
      }
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

    getTransactionsList: builder.query<any[], void>({
      async queryFn() {
        return {
          data: [
            {
              _id: 'tx_901',
              paymentId: 'pay_razorpay_9021',
              bookingNumber: 'JT-2026-9028',
              amount: 599,
              gatewayResponse: 'CAPTURED',
              commission: 100,
              tax: 50,
              settled: true,
              createdAt: '2026-08-07T12:00:00.000Z',
              providerName: 'Fast Electric Works',
              customerName: 'Anita Sharma'
            },
            {
              _id: 'tx_902',
              paymentId: 'pay_razorpay_9022',
              bookingNumber: 'JT-2026-9029',
              amount: 439,
              gatewayResponse: 'REFUNDED',
              commission: 80,
              tax: 40,
              settled: false,
              createdAt: '2026-08-06T14:30:00.000Z',
              providerName: 'Unassigned Plumber',
              customerName: 'Rohan Mehra'
            },
            {
              _id: 'tx_903',
              paymentId: 'pay_razorpay_9023',
              bookingNumber: 'JT-2026-9030',
              amount: 899,
              gatewayResponse: 'FAILED',
              commission: 180,
              tax: 80,
              settled: false,
              createdAt: '2026-08-05T09:15:00.000Z',
              providerName: 'Super Plumbing Services',
              customerName: 'Vikram Singh'
            }
          ]
        };
      }
    }),

    getWalletsList: builder.query<any[], { type: 'customer' | 'provider' }>({
      async queryFn({ type }) {
        if (type === 'customer') {
          return {
            data: [
              { _id: 'w_c01', holderId: 'cust_01', holderName: 'Anita Sharma', phone: '9876543210', balance: 500, status: 'ACTIVE', lastTransaction: 'Credit: Signup bonus (₹500)' },
              { _id: 'w_c02', holderId: 'cust_02', holderName: 'Rohan Mehra', phone: '9988776655', balance: 120, status: 'ACTIVE', lastTransaction: 'Debit: Booking JT-9028 (₹499)' },
              { _id: 'w_c03', holderId: 'cust_03', holderName: 'Vikram Singh', phone: '9123456789', balance: 0, status: 'FROZEN', lastTransaction: 'System check' }
            ]
          };
        } else {
          return {
            data: [
              { _id: 'w_p01', holderId: 'prov_01', holderName: 'Fast Electric Works', phone: '9890123456', balance: 3200, status: 'ACTIVE', lastTransaction: 'Credit: Completed job (₹499)' },
              { _id: 'w_p02', holderId: 'prov_02', holderName: 'A-1 Cleaning Solutions', phone: '9890887766', balance: 1450, status: 'ACTIVE', lastTransaction: 'Credit: Completed job (₹1199)' }
            ]
          };
        }
      }
    }),

    getWithdrawalsList: builder.query<any[], void>({
      async queryFn() {
        return {
          data: [
            { _id: 'wth_01', providerId: 'prov_01', providerName: 'Fast Electric Works', phone: '9890123456', amount: 2000, bankDetails: 'HDFC - A/C 123456789012', status: 'PENDING', createdAt: '2026-08-07T08:00:00.000Z' },
            { _id: 'wth_02', providerId: 'prov_02', providerName: 'A-1 Cleaning Solutions', phone: '9890887766', amount: 1000, bankDetails: 'ICICI - A/C 987654321012', status: 'PENDING', createdAt: '2026-08-07T10:00:00.000Z' }
          ]
        };
      }
    }),

    getAlertTemplates: builder.query<any[], void>({
      async queryFn() {
        return {
          data: [
            { id: 'tmp_1', name: 'OTP Verification', channel: 'SMS', content: 'Your JustTap OTP is {otp}. It expires in 5 minutes.' },
            { id: 'tmp_2', name: 'Provider Arrived Alert', channel: 'PUSH', content: 'Your provider {name} has arrived at your address.' },
            { id: 'tmp_3', name: 'Completed Job Invoice', channel: 'EMAIL', content: 'Thank you for booking with JustTap. Attached is your invoice for ₹{amount}.' }
          ]
        };
      }
    }),

    getDlqQueue: builder.query<any[], void>({
      async queryFn() {
        return {
          data: [
            { _id: 'dlq_01', messageId: 'msg_9028', channel: 'SMS', error: 'SMTP Timeout Response (504)', payload: { to: '+919876543210', body: 'Your JustTap OTP is 890123' }, timestamp: '2026-08-07T12:00:00.000Z' },
            { _id: 'dlq_02', messageId: 'msg_9029', channel: 'PUSH', error: 'FCM Client Token Expired (404)', payload: { to: 'fcm_tok_8928', title: 'Provider arrived', body: 'Your cleaner has arrived.' }, timestamp: '2026-08-07T14:30:00.000Z' }
          ]
        };
      }
    }),

    getPlatformSettings: builder.query<any, void>({
      async queryFn() {
        return {
          data: {
            commissionRate: 20,
            taxRate: 18,
            matchingRadius: 10,
            maintenanceMode: false,
            cloudinaryName: 'justtap-media',
            cloudinaryKey: '498291039828103'
          }
        };
      }
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useUpdateUserStatusMutation,
  useGetProvidersQuery,
  useApproveProviderRequestMutation,
  useRejectProviderRequestMutation,
  useGetApprovalDetailsQuery,
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
  useGetDisputesListQuery,
  useResolveDisputeMutation,
  useGetDisputeThreadQuery,
  useSendDisputeMessageMutation,
  useGetTransactionsListQuery,
  useGetWalletsListQuery,
  useGetWithdrawalsListQuery,
  useGetAlertTemplatesQuery,
  useGetDlqQueueQuery,
  useGetPlatformSettingsQuery,
} = adminApi;
