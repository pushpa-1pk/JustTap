import { baseApi } from './baseApi';
import { Booking } from './bookingApi';

export interface BookingRequestInvitation {
  _id: string;
  id?: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'TIMEOUT';
  expiresAt: string;
  createdAt: string;
}

export interface MatchingProviderResult {
  userId: string;
  businessName: string;
  phone: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  distance: number;
  rating: number;
  experience: number;
  price: number;
  providerServiceId: string;
}

type MatchingStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ON_BREAK' | 'IN_SERVICE';

export const matchingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchProvidersMatching: builder.mutation<{
      success: boolean;
      data: {
        providers: MatchingProviderResult[];
        total?: number;
        count?: number;
      };
    }, {
      latitude: number;
      longitude: number;
      radius?: number;
      serviceId?: string;
      limit?: number;
    }>({
      query: (body) => ({
        url: '/search/providers-matching',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: {
        success: boolean;
        data: { providers: MatchingProviderResult[]; total?: number };
      }) => ({
        ...response,
        data: {
          providers: response.data.providers || [],
          total: response.data.total ?? response.data.providers?.length ?? 0,
          count: response.data.total ?? response.data.providers?.length ?? 0,
        },
      }),
    }),
    dispatchBookingRequest: builder.mutation<{ success: boolean; data: { invitationId: string; booking: Booking } }, {
      serviceId: string;
      providerServiceId: string;
      bookingType: 'INSTANT' | 'SCHEDULED';
      scheduledStartTime: string;
      scheduledEndTime: string;
      customerAddressSnapshot: Booking['customerAddressSnapshot'];
      additionalNotes?: string;
    }>({
      query: (body) => ({
        url: '/booking-requests',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Bookings'],
    }),
    acceptBookingRequest: builder.mutation<{ success: boolean; message: string; data: Booking }, { invitationId: string }>({
      query: ({ invitationId }) => ({
        url: `/booking-requests/${invitationId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['Bookings'],
    }),
    rejectBookingRequest: builder.mutation<{ success: boolean; message: string }, { invitationId: string }>({
      query: ({ invitationId }) => ({
        url: `/booking-requests/${invitationId}/reject`,
        method: 'POST',
      }),
    }),
    updateMatchingStatus: builder.mutation<{ success: boolean; data: { status: MatchingStatus; activeBookingId?: string | null } }, { status: MatchingStatus; activeBookingId?: string | null }>({
      query: (body) => ({
        url: '/provider/status',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Profile'],
    }),
    updateMatchingLocation: builder.mutation<{ success: boolean; message: string }, { latitude: number; longitude: number; heading?: number; speed?: number; accuracy?: number }>({
      query: (body) => ({
        url: '/provider/location',
        method: 'PUT',
        data: body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useSearchProvidersMatchingMutation,
  useDispatchBookingRequestMutation,
  useAcceptBookingRequestMutation,
  useRejectBookingRequestMutation,
  useUpdateMatchingStatusMutation,
  useUpdateMatchingLocationMutation,
} = matchingApi;
