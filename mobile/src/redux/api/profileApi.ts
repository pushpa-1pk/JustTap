import { baseApi } from './baseApi';

export interface CustomerProfile {
  id?: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  language: string;
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
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: 'SAVINGS' | 'CURRENT';
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
      invalidatesTags: ['Profile'],
    }),
    updateCustomerProfile: builder.mutation<{ success: boolean; data: CustomerProfile }, Partial<CustomerProfile>>({
      query: (body) => ({
        url: '/profiles/customer',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Profile'],
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
      invalidatesTags: ['Profile'],
    }),
    updateProviderProfile: builder.mutation<{ success: boolean; data: ProviderProfile }, Partial<ProviderProfile>>({
      query: (body) => ({
        url: '/profiles/provider',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Profile'],
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
    }),
    createBankDetails: builder.mutation<{ success: boolean; data: BankDetails }, BankDetails>({
      query: (body) => ({
        url: '/bank-details',
        method: 'POST',
        data: body,
      }),
    }),
    updateBankDetails: builder.mutation<{ success: boolean; data: BankDetails }, Partial<BankDetails>>({
      query: (body) => ({
        url: '/bank-details',
        method: 'PUT',
        data: body,
      }),
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
