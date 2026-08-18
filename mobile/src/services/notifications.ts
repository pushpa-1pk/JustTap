import { Platform } from 'react-native';
import { useProviderStore } from '../store/providerStore';
import { JobOffer } from '../types/job';

let Notifications: any = null;

try {
  // Dynamically load expo-notifications to prevent Expo Go SDK 53 load-time crashes (Android Push restrictions)
  Notifications = require('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    } as any),
  });
} catch (err) {
  console.warn('[Notifications] expo-notifications load failed (likely running in Expo Go):', err);
}

class NotificationService {
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Notifications || Platform.OS === 'web') return null;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync() as any;
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync() as any;
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions denied');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch (err) {
      console.warn('Failed to register push notifications:', err);
      return null;
    }
  }

  setupNotificationListeners() {
    if (!Notifications) {
      return () => {};
    }

    try {
      const foregroundSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
        const data = notification.request.content.data;
        this.handleOfferPayload(data);
      });

      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data;
        this.handleOfferPayload(data);
      });

      return () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
      };
    } catch (err) {
      console.warn('Failed to register notification listeners:', err);
      return () => {};
    }
  }

  private handleOfferPayload(data: any) {
    if (!data || !data.jobId) return;

    const normalizedOffer: JobOffer = {
      id: data.jobId,
      serviceType: data.serviceType || 'General Service',
      distanceKm: Number(data.distanceKm) || 0,
      customerFirstName: data.customerFirstName || 'Customer',
      customerRating: Number(data.customerRating) || 5.0,
      price: Number(data.price) || 0,
      estimatedDurationMinutes: Number(data.estimatedDurationMinutes) || 30,
      expiresInSeconds: Number(data.expiresInSeconds) || 30,
    };

    useProviderStore.getState().setIncomingOffer(normalizedOffer);
  }
}

export const notificationService = new NotificationService();
