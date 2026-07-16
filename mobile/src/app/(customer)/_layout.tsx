import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function CustomerLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="provider-details" options={{ title: 'Provider Details' }} />
      <Stack.Screen name="book-service" options={{ title: 'Confirm Booking' }} />
      <Stack.Screen name="booking-success" options={{ headerShown: false }} />
      <Stack.Screen name="booking-details" options={{ title: 'Booking Status' }} />
      <Stack.Screen name="write-review" options={{ title: 'Leave Review' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
    </Stack>
  );
}
