import { baseApi } from './baseApi';

export interface Booking {
  _id: string;
  id?: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  providerServiceId: string;
  bookingType: 'INSTANT' | 'SCHEDULED';
  status: 
    | 'PENDING_PROVIDER_RESPONSE'
    | 'PROVIDER_ACCEPTED'
    | 'ON_THE_WAY'
    | 'ARRIVED'
    | 'SERVICE_STARTED'
    | 'SERVICE_COMPLETED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'FAILED'
    | 'DISPUTED';
  scheduledStartTime: string;
  scheduledEndTime: string;
  priceSnapshot: {
    basePrice: number;
    taxAmount: number;
    platformFee: number;
    finalAmount: number;
  };
  customerAddressSnapshot: {
    label: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    location: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  additionalNotes?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEntry {
  status: string;
  notes?: string;
  timestamp: string;
  updatedBy: string;
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Customer Booking Endpoints
    createBooking: builder.mutation<{ success: boolean; data: Booking }, {
      serviceId: string;
      providerServiceId: string;
      bookingType: 'INSTANT' | 'SCHEDULED';
      scheduledStartTime: string;
      scheduledEndTime: string;
      couponCode?: string;
      couponDiscountAmount?: number;
      customerAddressSnapshot: Booking['customerAddressSnapshot'];
      additionalNotes?: string;
    }>({
      query: (body) => ({
        url: '/bookings/customer',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Bookings'],
    }),
    getCustomerBookings: builder.query<{ success: boolean; data: Booking[] }, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/bookings/customer/history',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['Bookings'],
    }),
    getCustomerBookingById: builder.query<{ success: boolean; data: Booking }, string>({
      query: (id) => ({ url: `/bookings/customer/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Bookings', id }],
    }),
    getCustomerBookingTimeline: builder.query<{ success: boolean; data: TimelineEntry[] }, string>({
      query: (id) => ({ url: `/bookings/customer/${id}/timeline`, method: 'GET' }),
    }),

    // Provider Booking Endpoints
    getProviderPendingBookings: builder.query<{ success: boolean; data: Booking[] }, void>({
      query: () => ({ url: '/bookings/provider/pending', method: 'GET' }),
      providesTags: ['Bookings'],
    }),
    getProviderActiveBookings: builder.query<{ success: boolean; data: Booking[] }, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/bookings/provider/active',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['Bookings'],
    }),
    getProviderBookingHistory: builder.query<{ success: boolean; data: Booking[] }, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/bookings/provider/history',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['Bookings'],
    }),
    getProviderBookingById: builder.query<{ success: boolean; data: Booking }, string>({
      query: (id) => ({ url: `/bookings/provider/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Bookings', id }],
    }),
    acceptBooking: builder.mutation<{ success: boolean; message: string; data: Booking }, string>({
      query: (id) => ({
        url: `/bookings/provider/${id}/accept`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => ['Bookings', { type: 'Bookings', id }],
    }),
    advanceBookingStatus: builder.mutation<{ success: boolean; data: Booking }, { id: string; nextStatus: 'ON_THE_WAY' | 'ARRIVED' | 'COMPLETED' }>({
      query: ({ id, nextStatus }) => ({
        url: `/bookings/provider/${id}/advance`,
        method: 'PATCH',
        data: { nextStatus },
      }),
      invalidatesTags: (result, error, { id }) => ['Bookings', { type: 'Bookings', id }],
    }),
    verifyBookingHandshake: builder.mutation<{ success: boolean; message: string; data: Booking }, { id: string; rawOtp: string; purpose: 'START_SERVICE' | 'COMPLETE_SERVICE' }>({
      query: ({ id, ...body }) => ({
        url: `/bookings/provider/${id}/verify-handshake`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => ['Bookings', { type: 'Bookings', id }],
    }),

    // Shared Cancellation & Rescheduling
    cancelBooking: builder.mutation<{ success: boolean; message: string }, { id: string; reasonCode: string; customExplanation?: string }>({
      query: ({ id, ...body }) => ({
        url: `/bookings/${id}/cancel`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => ['Bookings', { type: 'Bookings', id }],
    }),
    rescheduleBooking: builder.mutation<{ success: boolean; message: string }, {
      id: string;
      newStartTime: string;
      newEndTime: string;
      reasonCode: string;
      customExplanation?: string;
    }>({
      query: ({ id, ...body }) => ({
        url: `/bookings/${id}/reschedule`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => ['Bookings', { type: 'Bookings', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateBookingMutation,
  useGetCustomerBookingsQuery,
  useGetCustomerBookingByIdQuery,
  useGetCustomerBookingTimelineQuery,
  useGetProviderPendingBookingsQuery,
  useGetProviderActiveBookingsQuery,
  useGetProviderBookingHistoryQuery,
  useGetProviderBookingByIdQuery,
  useAcceptBookingMutation,
  useAdvanceBookingStatusMutation,
  useVerifyBookingHandshakeMutation,
  useCancelBookingMutation,
  useRescheduleBookingMutation,
} = bookingApi;
