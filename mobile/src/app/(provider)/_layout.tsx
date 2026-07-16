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
    </Stack>
  );
}
