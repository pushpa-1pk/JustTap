import { baseApi } from './baseApi';
import { AppUserRole, AuthPlatform, normalizeProfileCompletion, normalizeUserRole, normalizeUserRoles } from '@/utils/auth';

type RawAuthUser = {
  id?: string;
  _id?: string;
  phone: string;
  role: string;
  roles?: string[];
  accountStatus: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'DELETED';
  isProfileComplete?: boolean;
  profileCompleted?: boolean;
};

type RawAuthResponse = {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt?: string;
    expiresIn?: number;
    isNewUser?: boolean;
    user: RawAuthUser;
  };
};

const normalizeUser = (user: RawAuthUser) => ({
  id: user.id || user._id || '',
  phone: user.phone,
  role: normalizeUserRole(user.role),
  roles: normalizeUserRoles(user.roles, user.role),
  accountStatus: user.accountStatus,
  isProfileComplete: normalizeProfileCompletion(user),
});

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendOtp: builder.mutation<{ success: boolean; message: string; data: { alreadyExists?: boolean; isExistingUser?: boolean } }, { phone: string }>({
      query: (body) => ({
        url: '/auth/send-otp',
        method: 'POST',
        data: body,
      }),
    }),
    verifyOtp: builder.mutation<{
      success: boolean;
      message: string;
      data: {
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt?: string;
        expiresIn?: number;
        isNewUser?: boolean;
        user: {
          id: string;
          phone: string;
          role: AppUserRole;
          roles: AppUserRole[];
          accountStatus: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'DELETED';
          isProfileComplete: boolean;
        };
      };
    }, {
      phone: string;
      otp: string;
      role: 'customer' | 'provider' | 'admin';
      deviceId: string;
      deviceName: string;
      platform: AuthPlatform;
      appVersion?: string;
    }>({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: RawAuthResponse) => ({
        ...response,
        data: {
          ...response.data,
          user: normalizeUser(response.data.user),
        },
      }),
    }),
    getMe: builder.query<{
      success: boolean;
      message: string;
      data: {
        id: string;
        phone: string;
        role: AppUserRole;
        roles: AppUserRole[];
        accountStatus: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'DELETED';
        isProfileComplete: boolean;
      };
    }, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; message: string; data: RawAuthUser }) => ({
        ...response,
        data: normalizeUser(response.data),
      }),
      providesTags: ['User'],
    }),
    logout: builder.mutation<{ success: boolean; message: string }, { deviceId: string }>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        data: body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
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
