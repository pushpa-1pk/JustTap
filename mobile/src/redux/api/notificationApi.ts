import { baseApi } from './baseApi';

export interface InAppNotification {
  _id: string;
  userId: string;
  title: string;
  body: string;
  category: 'booking' | 'payment' | 'review' | 'system';
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export interface NotificationPreferences {
  categories: {
    booking: boolean;
    payment: boolean;
    review: boolean;
  };
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inapp: boolean;
  };
  language: string;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerDevice: builder.mutation<{ success: boolean; message: string }, { fcmToken: string; deviceId: string; platform: 'ANDROID' | 'IOS' | 'WEB'; appVersion: string }>({
      query: (body) => ({
        url: '/devices/register',
        method: 'POST',
        data: body,
      }),
    }),
    updateNotificationPreferences: builder.mutation<{ success: boolean; message: string }, NotificationPreferences>({
      query: (body) => ({
        url: '/preferences',
        method: 'PUT',
        data: body,
      }),
    }),
    getNotifications: builder.query<{ success: boolean; data: InAppNotification[] }, void>({
      query: () => ({
        url: '/notifications',
        method: 'GET',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterDeviceMutation,
  useUpdateNotificationPreferencesMutation,
  useGetNotificationsQuery,
} = notificationApi;
