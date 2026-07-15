import { Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

export const localNotifications = {
  /**
   * Request push/local notification permissions.
   */
  requestPermissions: async () => {
    // In production React Native: use expo-notifications
    // Simulating permission request
    return true;
  },

  /**
   * Send an instant local alert notification
   */
  triggerLocalNotification: async (title: string, body: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Simulate notification using native alert popup
    Alert.alert(
      `🔔 JustTap: ${title}`,
      body,
      [{ text: 'OK', style: 'cancel' }],
      { cancelable: true }
    );
  },

  /**
   * Schedule a notification (e.g. for service reminders)
   */
  scheduleReminder: async (title: string, body: string, delayMs: number) => {
    setTimeout(() => {
      localNotifications.triggerLocalNotification(title, body);
    }, delayMs);
  }
};
