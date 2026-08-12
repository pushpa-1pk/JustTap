import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';

export default function BookingSuccessScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = params.bookingId || 'CONF-992381';

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleTrackBooking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(customer)/(tabs)/bookings');
  };

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(customer)/(tabs)/home');
  };

  return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      
      {/* Animated Success Icon Card */}
      <View style={styles.animatedBox}>
        <Svg width={120} height={120} viewBox="0 0 100 100">
          {/* Green Glowing Circle */}
          <Circle 
            cx={50} 
            cy={50} 
            r={45} 
            fill={colors.secondary + '15'} 
            stroke={colors.secondary} 
            strokeWidth={4} 
          />
          {/* Dynamic checkmark reveal path */}
          <Path 
            d="M30 50 L45 65 L70 35" 
            fill="transparent" 
            stroke={colors.secondary} 
            strokeWidth={6} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeDasharray={100}
            strokeDashoffset={0}
          />
        </Svg>

        <Text style={[typography.h1, { color: colors.text, marginTop: spacing.xl, textAlign: 'center' }]}>
          Booking Confirmed!
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 }]}>
          Your service booking request has been successfully dispatched to the provider.
        </Text>
      </View>

      {/* Details Box */}
      <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.detailRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>BOOKING REFERENCE</Text>
          <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
            {bookingId}
          </Text>
        </View>
      </View>

      {/* Navigation Triggers */}
      <View style={styles.buttonGroup}>
        <Pressable 
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={handleTrackBooking}
        >
          <Text style={[typography.buttonText, { color: colors.onPrimary }]}>Track Service Progress</Text>
        </Pressable>

        <Pressable 
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={handleGoHome}
        >
          <Text style={[typography.buttonText, { color: colors.text }]}>Back to Home</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedBox: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  detailsCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 40,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
