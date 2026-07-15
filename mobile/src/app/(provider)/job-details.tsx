import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapViewComponent from '@/components/common/MapViewComponent';
import { useTheme } from '@/hooks/useTheme';
import { 
  useGetProviderBookingByIdQuery, 
  useAdvanceBookingStatusMutation, 
  useVerifyBookingHandshakeMutation 
} from '@/redux/api/bookingApi';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function ProviderJobDetailsScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = params.bookingId || '';

  // OTP form input state
  const [otpCode, setOtpCode] = useState('');

  // API Queries & Mutations
  const { data: bookingRes, isLoading, refetch, isError } = useGetProviderBookingByIdQuery(bookingId, { skip: !bookingId });
  const [advanceStatus, { isLoading: isAdvancing }] = useAdvanceBookingStatusMutation();
  const [verifyHandshake, { isLoading: isVerifying }] = useVerifyBookingHandshakeMutation();

  const booking = bookingRes?.data;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.bodyLarge, { color: colors.danger }]}>Failed to load job details.</Text>
      </View>
    );
  }

  // Location snapshots
  const coords = booking.customerAddressSnapshot?.location?.coordinates || [72.8777, 19.0760];
  const clientLat = coords[1];
  const clientLng = coords[0];

  const handleAdvanceState = async (nextState: 'ON_THE_WAY' | 'ARRIVED' | 'COMPLETED') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await advanceStatus({ id: bookingId, nextStatus: nextState }).unwrap();
      refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Advance state failed:', err);
      Alert.alert('Status Error', err.data?.message || 'Failed to update job status');
    }
  };

  const handleVerifyOtp = async (purpose: 'START_SERVICE' | 'COMPLETE_SERVICE') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (otpCode.length !== 6) {
      Alert.alert('Invalid PIN', 'Please enter a valid 6-digit OTP code');
      return;
    }

    try {
      const response = await verifyHandshake({
        id: bookingId,
        rawOtp: otpCode,
        purpose,
      }).unwrap();

      if (response.success) {
        setOtpCode('');
        refetch();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('OTP Verified', `Handshake for ${purpose.replace('_', ' ')} completed successfully!`);
      }
    } catch (err: any) {
      console.error('Verify handshake failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Verification Failed', err.data?.message || 'Incorrect OTP code entered');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Map Header showing Client Address */}
        <View style={styles.mapContainer}>
          <MapViewComponent
            latitude={clientLat}
            longitude={clientLng}
            title="Job Destination"
            description={booking.customerAddressSnapshot?.addressLine1}
          />
        </View>

        {/* Details Content Box */}
        <View style={[styles.detailsBox, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>JOB NUMBER: #{booking._id.substring(booking._id.length - 8).toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.secondary + '20' }]}>
              <Text style={[typography.caption, { color: colors.secondary, fontWeight: '800' }]}>
                {booking.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {/* Customer info card */}
          <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>CUSTOMER</Text>
          <Text style={[typography.h3, { color: colors.text, fontWeight: '700' }]}>
            {booking.customerAddressSnapshot?.label.toUpperCase()} DESTINATION
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
            📍 {booking.customerAddressSnapshot?.addressLine1}, {booking.customerAddressSnapshot?.addressLine2 || ''}, {booking.customerAddressSnapshot?.city}
          </Text>

          {booking.additionalNotes && (
            <View style={[styles.notesPanel, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>CLIENT NOTES</Text>
              <Text style={[typography.bodyMedium, { color: colors.text, marginTop: 4 }]}>
                "{booking.additionalNotes}"
              </Text>
            </View>
          )}

          {/* Job Payout */}
          <View style={[styles.payoutCard, { borderColor: colors.border }]}>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Estimated Net Earnings</Text>
            <Text style={[typography.h1, { color: colors.secondary, fontWeight: '800' }]}>
              ₹{booking.priceSnapshot?.finalAmount}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* DYNAMIC JOB STEP CONTROLLER FORM */}
          <View style={styles.controlsSection}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Action Panel</Text>

            {/* A. Pending Response -> Accept */}
            {booking.status === 'PENDING_PROVIDER_RESPONSE' && (
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                Go to the Jobs list tab to Accept or Decline this invitation.
              </Text>
            )}

            {/* B. Provider Accepted -> Drive */}
            {booking.status === 'PROVIDER_ACCEPTED' && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                onPress={() => handleAdvanceState('ON_THE_WAY')}
                disabled={isAdvancing}
              >
                {isAdvancing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Start Traveling to Job</Text>}
              </Pressable>
            )}

            {/* C. En Route -> Arrive */}
            {booking.status === 'ON_THE_WAY' && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                onPress={() => handleAdvanceState('ARRIVED')}
                disabled={isAdvancing}
              >
                {isAdvancing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>I Have Arrived at Location</Text>}
              </Pressable>
            )}

            {/* D. Arrived -> START Handshake */}
            {booking.status === 'ARRIVED' && (
              <View>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                  Ask client for the <Text style={{ color: colors.text, fontWeight: '700' }}>Start Service PIN</Text> to begin work.
                </Text>
                <TextInput
                  style={[styles.otpInput, typography.h2, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter 6-digit Start OTP"
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: colors.secondary, marginTop: spacing.md }]}
                  onPress={() => handleVerifyOtp('START_SERVICE')}
                  disabled={isVerifying}
                >
                  {isVerifying ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Verify & Start Job</Text>}
                </Pressable>
              </View>
            )}

            {/* E. Started -> COMPLETE Handshake */}
            {booking.status === 'SERVICE_STARTED' && (
              <View>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                  Ask client for the <Text style={{ color: colors.text, fontWeight: '700' }}>Complete Service PIN</Text> after finishing work.
                </Text>
                <TextInput
                  style={[styles.otpInput, typography.h2, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter 6-digit Complete OTP"
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: colors.secondary, marginTop: spacing.md }]}
                  onPress={() => handleVerifyOtp('COMPLETE_SERVICE')}
                  disabled={isVerifying}
                >
                  {isVerifying ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Verify & Complete Job</Text>}
                </Pressable>
              </View>
            )}

            {/* F. Completed Handshake -> Done */}
            {booking.status === 'SERVICE_COMPLETED' && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                onPress={() => handleAdvanceState('COMPLETED')}
                disabled={isAdvancing}
              >
                {isAdvancing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Finish Job & Log Out</Text>}
              </Pressable>
            )}

            {/* G. Finished */}
            {['COMPLETED', 'CANCELLED'].includes(booking.status) && (
              <View style={[styles.successBanner, { backgroundColor: colors.secondary + '15' }]}>
                <Text style={[typography.bodyMedium, { color: colors.secondary, fontWeight: '700', textAlign: 'center' }]}>
                  This booking has been finalized. status: {booking.status}
                </Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 200,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  detailsBox: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    padding: 24,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  label: {
    fontWeight: '700',
    marginBottom: 4,
  },
  notesPanel: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 16,
  },
  payoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 16,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  controlsSection: {
    marginBottom: 32,
  },
  actionBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  otpInput: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    letterSpacing: 8,
  },
  successBanner: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
