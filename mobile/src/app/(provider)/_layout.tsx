import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function ProviderStackLayout() {
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
      <Stack.Screen name="job-details" options={{ title: 'Job Dispatch Status' }} />
      <Stack.Screen name="kyc-upload" options={{ title: 'KYC Document Verification' }} />
      <Stack.Screen name="bank-setup" options={{ title: 'Configure Payout Bank' }} />
      <Stack.Screen name="wallet" options={{ title: 'My Wallet & Payouts' }} />
      <Stack.Screen name="notifications" options={{ title: 'Alert Inbox' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Provider Profile' }} />
      <Stack.Screen name="business-info" options={{ title: 'Business Details' }} />
      <Stack.Screen name="service-areas" options={{ title: 'Manage Service Areas' }} />
      <Stack.Screen name="working-hours" options={{ title: 'Set Working Hours' }} />
      <Stack.Screen name="performance" options={{ title: 'My Performance' }} />
      <Stack.Screen name="reviews" options={{ title: 'Customer Reviews & Ratings' }} />
      <Stack.Screen name="settings" options={{ title: 'Provider Settings' }} />
    </Stack>
  );
}
