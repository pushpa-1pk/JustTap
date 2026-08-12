import { baseApi } from './baseApi';

export interface CustomerProfile {
  id?: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  language: string;
  profileImage?: string;
  profileCompletion?: number;
}

export interface ProviderProfile {
  id?: string;
  businessName: string;
  experience: number;
  workingRadius: number;
  latitude: number;
  longitude: number;
  workingHours: {
    start: string;
    end: string;
  };
  bio: string;
  isOnline?: boolean;
  verificationStatus?: 'pending' | 'under_review' | 'approved' | 'rejected';
  profileCompletion?: number;
  rating?: number;
  totalJobs?: number;
  // Persisted as GeoJSON; latitude/longitude above are the flat wire format.
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface Address {
  id?: string;
  _id?: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
}

export interface BankDetails {
  id?: string;
  accountHolderName: string;
  // Write-only: sent on create/update, never returned by the API.
  accountNumber?: string;
  accountNumberMasked?: string;
  ifscCode: string;
  bankName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  verified?: boolean;
}

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Customer Profiles
    getCustomerProfile: builder.query<{ success: boolean; data: CustomerProfile }, void>({
      query: () => ({ url: '/profiles/customer', method: 'GET' }),
      providesTags: ['Profile'],
    }),
    createCustomerProfile: builder.mutation<{ success: boolean; data: CustomerProfile }, CustomerProfile>({
      query: (body) => ({
        url: '/profiles/customer',
        method: 'POST',
        data: body,
      }),
      // 'User' because the profile service mirrors completion back to auth-service.
      invalidatesTags: ['Profile', 'User'],
    }),
    updateCustomerProfile: builder.mutation<{ success: boolean; data: CustomerProfile }, Partial<CustomerProfile>>({
      query: (body) => ({
        url: '/profiles/customer',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Profile', 'User'],
    }),
    getCustomerProfileWithAddresses: builder.query<{ success: boolean; data: { profile: CustomerProfile; addresses: Address[] } }, void>({
      query: () => ({ url: '/profiles/customer/with-addresses', method: 'GET' }),
      providesTags: ['Profile', 'Addresses'],
    }),

    // Provider Profiles
    getProviderProfile: builder.query<{ success: boolean; data: ProviderProfile }, void>({
      query: () => ({ url: '/profiles/provider', method: 'GET' }),
      providesTags: ['Profile'],
    }),
    createProviderProfile: builder.mutation<{ success: boolean; data: ProviderProfile }, ProviderProfile>({
      query: (body) => ({
        url: '/profiles/provider',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Profile', 'User'],
    }),
    // latitude/longitude must be sent together or not at all — the server maps
    // the pair onto currentLocation and rejects a lone coordinate.
    updateProviderProfile: builder.mutation<
      { success: boolean; data: ProviderProfile },
      Partial<Omit<ProviderProfile, 'currentLocation'>>
    >({
      query: (body) => ({
        url: '/profiles/provider',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Profile', 'User'],
    }),
    updateProviderLocation: builder.mutation<{ success: boolean; message: string }, { latitude: number; longitude: number }>({
      query: (body) => ({
        url: '/profiles/provider/location',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Profile'],
    }),
    updateProviderOnlineStatus: builder.mutation<{ success: boolean; data: { isOnline: boolean } }, { isOnline: boolean }>({
      query: (body) => ({
        url: '/profiles/provider/online-status',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Profile'],
    }),
    requestProviderApproval: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/profiles/provider/request-approval',
        method: 'POST',
      }),
      invalidatesTags: ['Profile'],
    }),

    // Addresses book management
    getAddresses: builder.query<{ success: boolean; data: Address[] }, void>({
      query: () => ({ url: '/addresses', method: 'GET' }),
      providesTags: ['Addresses'],
    }),
    createAddress: builder.mutation<{ success: boolean; data: Address }, Omit<Address, 'id' | '_id'>>({
      query: (body) => ({
        url: '/addresses',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Addresses'],
    }),
    updateAddress: builder.mutation<{ success: boolean; data: Address }, { id: string; fields: Partial<Address> }>({
      query: ({ id, fields }) => ({
        url: `/addresses/${id}`,
        method: 'PUT',
        data: fields,
      }),
      invalidatesTags: ['Addresses'],
    }),
    setPrimaryAddress: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/addresses/${id}/set-primary`,
        method: 'PUT',
      }),
      invalidatesTags: ['Addresses'],
    }),
    deleteAddress: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/addresses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Addresses'],
    }),

    // Bank Details
    getBankDetails: builder.query<{ success: boolean; data: BankDetails }, void>({
      query: () => ({ url: '/bank-details', method: 'GET' }),
      providesTags: ['BankDetails'],
    }),
    createBankDetails: builder.mutation<{ success: boolean; data: BankDetails }, BankDetails>({
      query: (body) => ({
        url: '/bank-details',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['BankDetails'],
    }),
    updateBankDetails: builder.mutation<{ success: boolean; data: BankDetails }, Partial<BankDetails>>({
      query: (body) => ({
        url: '/bank-details',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['BankDetails'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomerProfileQuery,
  useCreateCustomerProfileMutation,
  useUpdateCustomerProfileMutation,
  useGetCustomerProfileWithAddressesQuery,
  useGetProviderProfileQuery,
  useCreateProviderProfileMutation,
  useUpdateProviderProfileMutation,
  useUpdateProviderLocationMutation,
  useUpdateProviderOnlineStatusMutation,
  useRequestProviderApprovalMutation,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useSetPrimaryAddressMutation,
  useDeleteAddressMutation,
  useGetBankDetailsQuery,
  useCreateBankDetailsMutation,
  useUpdateBankDetailsMutation,
} = profileApi;
