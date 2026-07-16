import { baseApi } from './baseApi';

type RawBooking = {
  _id: string;
  customerId: string;
  providerId: string | null;
  serviceId: string;
  providerServiceId: string;
  bookingType: 'INSTANT' | 'SCHEDULED';
  bookingStatus?: string;
  status?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  snapshotPricing?: {
    serviceBasePrice?: number;
    taxAmount?: number;
    platformCommissionFee?: number;
    totalAmountToPay?: number;
  };
  priceSnapshot?: {
    basePrice?: number;
    taxAmount?: number;
    platformFee?: number;
    finalAmount?: number;
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
      coordinates: [number, number];
    };
  };
  providerSnapshot?: {
    businessName?: string | null;
    phone?: string | null;
  };
  additionalNotes?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
};

export interface Booking {
  _id: string;
  id?: string;
  customerId: string;
  providerId: string | null;
  serviceId: string;
  providerServiceId: string;
  bookingType: 'INSTANT' | 'SCHEDULED';
  status:
    | 'REQUESTED'
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
  customerAddressSnapshot: RawBooking['customerAddressSnapshot'];
  providerSnapshot?: RawBooking['providerSnapshot'];
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

const normalizeBooking = (booking: RawBooking): Booking => ({
  _id: booking._id,
  id: booking._id,
  customerId: booking.customerId,
  providerId: booking.providerId,
  serviceId: booking.serviceId,
  providerServiceId: booking.providerServiceId,
  bookingType: booking.bookingType,
  status: (booking.status || booking.bookingStatus || 'REQUESTED') as Booking['status'],
  scheduledStartTime: booking.scheduledStartTime,
  scheduledEndTime: booking.scheduledEndTime,
  priceSnapshot: {
    basePrice: booking.priceSnapshot?.basePrice ?? booking.snapshotPricing?.serviceBasePrice ?? 0,
    taxAmount: booking.priceSnapshot?.taxAmount ?? booking.snapshotPricing?.taxAmount ?? 0,
    platformFee: booking.priceSnapshot?.platformFee ?? booking.snapshotPricing?.platformCommissionFee ?? 0,
    finalAmount: booking.priceSnapshot?.finalAmount ?? booking.snapshotPricing?.totalAmountToPay ?? 0,
  },
  customerAddressSnapshot: booking.customerAddressSnapshot,
  providerSnapshot: booking.providerSnapshot,
  additionalNotes: booking.additionalNotes,
  paymentStatus: booking.paymentStatus,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
});

const normalizeBookingCollection = (payload: unknown): Booking[] => {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeBooking(item as RawBooking));
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { docs?: unknown[] }).docs)) {
    return ((payload as { docs: RawBooking[] }).docs).map(normalizeBooking);
  }

  return [];
};

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      transformResponse: (response: { success: boolean; data: RawBooking }) => ({
        ...response,
        data: normalizeBooking(response.data),
      }),
      invalidatesTags: ['Bookings'],
    }),
    getCustomerBookings: builder.query<{ success: boolean; data: Booking[] }, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/bookings/customer/history',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: { success: boolean; data: unknown }) => ({
        ...response,
        data: normalizeBookingCollection(response.data),
      }),
      providesTags: ['Bookings'],
    }),
    getCustomerBookingById: builder.query<{ success: boolean; data: Booking }, string>({
      query: (id) => ({ url: `/bookings/customer/${id}`, method: 'GET' }),
      transformResponse: (response: { success: boolean; data: RawBooking }) => ({
        ...response,
        data: normalizeBooking(response.data),
      }),
      providesTags: (result, error, id) => [{ type: 'Bookings', id }],
    }),
    getCustomerBookingTimeline: builder.query<{ success: boolean; data: TimelineEntry[] }, string>({
      query: (id) => ({ url: `/bookings/customer/${id}/timeline`, method: 'GET' }),
    }),
    getProviderPendingBookings: builder.query<{ success: boolean; data: Booking[] }, void>({
      query: () => ({ url: '/bookings/provider/pending', method: 'GET' }),
      transformResponse: (response: { success: boolean; data: unknown }) => ({
        ...response,
        data: normalizeBookingCollection(response.data),
      }),
      providesTags: ['Bookings'],
    }),
    getProviderActiveBookings: builder.query<{ success: boolean; data: Booking[] }, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/bookings/provider/active',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: { success: boolean; data: unknown }) => ({
        ...response,
        data: normalizeBookingCollection(response.data),
      }),
      providesTags: ['Bookings'],
    }),
    getProviderBookingHistory: builder.query<{ success: boolean; data: Booking[] }, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/bookings/provider/history',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: { success: boolean; data: unknown }) => ({
        ...response,
        data: normalizeBookingCollection(response.data),
      }),
      providesTags: ['Bookings'],
    }),
    getProviderBookingById: builder.query<{ success: boolean; data: Booking }, string>({
      query: (id) => ({ url: `/bookings/provider/${id}`, method: 'GET' }),
      transformResponse: (response: { success: boolean; data: RawBooking }) => ({
        ...response,
        data: normalizeBooking(response.data),
      }),
      providesTags: (result, error, id) => [{ type: 'Bookings', id }],
    }),
    acceptBooking: builder.mutation<{ success: boolean; message: string; data: Booking }, string>({
      query: (id) => ({
        url: `/bookings/provider/${id}/accept`,
        method: 'PATCH',
      }),
      transformResponse: (response: { success: boolean; message: string; data: RawBooking }) => ({
        ...response,
        data: normalizeBooking(response.data),
      }),
      invalidatesTags: (result, error, id) => ['Bookings', { type: 'Bookings', id }],
    }),
    advanceBookingStatus: builder.mutation<{ success: boolean; data: Booking }, { id: string; nextStatus: 'ON_THE_WAY' | 'ARRIVED' | 'COMPLETED' }>({
      query: ({ id, nextStatus }) => ({
        url: `/bookings/provider/${id}/advance`,
        method: 'PATCH',
        data: { nextStatus },
      }),
      transformResponse: (response: { success: boolean; data: RawBooking }) => ({
        ...response,
        data: normalizeBooking(response.data),
      }),
      invalidatesTags: (result, error, { id }) => ['Bookings', { type: 'Bookings', id }],
    }),
    verifyBookingHandshake: builder.mutation<{ success: boolean; message: string; data: Booking }, { id: string; rawOtp: string; purpose: 'START_SERVICE' | 'COMPLETE_SERVICE' }>({
      query: ({ id, ...body }) => ({
        url: `/bookings/provider/${id}/verify-handshake`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: { success: boolean; message: string; data: RawBooking }) => ({
        ...response,
        data: normalizeBooking(response.data),
      }),
      invalidatesTags: (result, error, { id }) => ['Bookings', { type: 'Bookings', id }],
    }),
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
