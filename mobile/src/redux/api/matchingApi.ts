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
    coordinates: [number, number]; // [longitude, latitude]
  };
  distance: number;
  rating: number;
  experience: number;
  price: number;
  providerServiceId: string;
}

export const matchingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Customer search for nearby providers (Matching Service optimization pipeline)
    searchProvidersMatching: builder.mutation<{
      success: boolean;
      data: {
        providers: MatchingProviderResult[];
        count: number;
      };
    }, {
      latitude: number;
      longitude: number;
      categoryId?: string;
      serviceId?: string;
      keyword?: string;
      minPrice?: number;
      maxPrice?: number;
      minExperience?: number;
      minRating?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }>({
      query: (body) => ({
        url: '/search/providers-matching',
        method: 'POST',
        data: body,
      }),
    }),

    // Customer dispatches booking request invitations to nearby matching providers
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

    // Provider accepts a dispatched booking request invitation
    acceptBookingRequest: builder.mutation<{ success: boolean; message: string; data: Booking }, { invitationId: string }>({
      query: ({ invitationId }) => ({
        url: `/booking-requests/${invitationId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['Bookings'],
    }),

    // Provider rejects a dispatched booking request invitation
    rejectBookingRequest: builder.mutation<{ success: boolean; message: string }, { invitationId: string }>({
      query: ({ invitationId }) => ({
        url: `/booking-requests/${invitationId}/reject`,
        method: 'POST',
      }),
    }),

    // Provider updates dynamic presence status (online/offline state) in matching index
    updateMatchingStatus: builder.mutation<{ success: boolean; data: { isOnline: boolean } }, { isOnline: boolean }>({
      query: (body) => ({
        url: '/provider/status',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Profile'],
    }),

    // Provider updates dynamic real-time location coordinates in matching index
    updateMatchingLocation: builder.mutation<{ success: boolean; message: string }, { latitude: number; longitude: number }>({
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
