import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomHeaderProps {
  navigation: any;
  route: any;
  options: any;
  back?: any;
}

function CustomHeader({ navigation, route, options, back }: CustomHeaderProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const title = options.title || route.name;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 12,
        },
      ]}
    >
      {back ? (
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={[typography.h3, styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.placeholder} />
    </View>
  );
}

export default function ProviderStackLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
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
      <Stack.Screen name="job-tracking" options={{ title: 'Active Job Progress' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
});

