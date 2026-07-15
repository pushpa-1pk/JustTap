import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendOtp: builder.mutation<{ success: boolean; message: string; data: { alreadyExists: boolean } }, { phone: string }>({
      query: (body) => ({
        url: '/auth/send-otp',
        method: 'POST',
        data: body,
      }),
    }),
    verifyOtp: builder.mutation<{
      success: boolean;
      data: {
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          phone: string;
          role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
          accountStatus: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
          isProfileComplete: boolean;
        };
      };
    }, {
      phone: string;
      otp: string;
      role: 'customer' | 'provider' | 'admin';
      deviceId: string;
      deviceName: string;
      platform: 'MOBILE';
    }>({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        data: body,
      }),
    }),
    getMe: builder.query<{
      success: boolean;
      data: {
        id: string;
        phone: string;
        role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
        accountStatus: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
        isProfileComplete: boolean;
      };
    }, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    logout: builder.mutation<{ success: boolean; message: string }, { deviceId: string }>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        data: body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Custom cleanups can be triggered here if needed
        } catch (error) {
          console.error('API logout error:', error);
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
} = authApi;
