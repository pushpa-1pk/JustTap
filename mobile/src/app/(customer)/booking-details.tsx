import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { 
  useGetCustomerBookingByIdQuery, 
  useGetCustomerBookingTimelineQuery,
  useCancelBookingMutation,
  useRescheduleBookingMutation
} from '@/redux/api/bookingApi';
import {
  useCreateOrderMutation,
  useVerifyPaymentMutation
} from '@/redux/api/paymentApi';
import MapViewComponent from '@/components/common/MapViewComponent';
import useTracking from '@/hooks/useTracking';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function BookingDetailsScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = params.bookingId || '';

  // API Queries & Mutations
  const { data: bookingRes, isLoading, refetch: refetchBooking, isError } = useGetCustomerBookingByIdQuery(bookingId, { skip: !bookingId });
  const { data: timelineRes, isLoading: isTimelineLoading } = useGetCustomerBookingTimelineQuery(bookingId, { skip: !bookingId });
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();
  const [rescheduleBooking, { isLoading: isRescheduling }] = useRescheduleBookingMutation();
  
  // Payment mutations
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyPaymentMutation();

  const booking = bookingRes?.data;
  const timeline = timelineRes?.data || [];

  // Live Socket Tracking Coordinate subscription
  const isActive = booking ? ['PROVIDER_ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED'].includes(booking.status) : false;
  const { coordinates: liveCoords } = useTracking(booking && booking.status === 'ON_THE_WAY' ? booking._id : null);

  // Modal Control States
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('CUSTOMER_CHANGED_MIND');
  const [cancelExplain, setCancelExplain] = useState('');
  
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [newDate, setNewDate] = useState('2026-07-20');
  const [newTime, setNewTime] = useState('10:00');

  // Payment Checkout States
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [gatewayOrderId, setGatewayOrderId] = useState('');
  const [payAmount, setPayAmount] = useState(0);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.bodyLarge, { color: colors.danger }]}>Failed to load booking details.</Text>
      </View>
    );
  }

  // Resolve Map Centering coordinates
  const customerCoords = booking.customerAddressSnapshot?.location?.coordinates || [72.8777, 19.0760];
  const mapLat = liveCoords?.latitude || customerCoords[1];
  const mapLng = liveCoords?.longitude || customerCoords[0];

  const handleCancelSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await cancelBooking({
        id: bookingId,
        reasonCode: cancelReason,
        customExplanation: cancelExplain || undefined,
      }).unwrap();
      setCancelModalVisible(false);
      refetchBooking();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Cancel booking failed:', err);
    }
  };

  const handleRescheduleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const newStart = new Date(`${newDate}T${newTime}:00.000Z`);
      const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000); // +1 hour

      await rescheduleBooking({
        id: bookingId,
        newStartTime: newStart.toISOString(),
        newEndTime: newEnd.toISOString(),
        reasonCode: 'CUSTOMER_REQUEST',
        customExplanation: 'Rescheduled from mobile client',
      }).unwrap();
      setRescheduleModalVisible(false);
      refetchBooking();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Reschedule failed:', err);
    }
  };

  const handleTriggerPayment = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const res = await createOrder({ bookingId }).unwrap();
      if (res.success && res.data) {
        setGatewayOrderId(res.data.gatewayOrderId);
        setPayAmount(res.data.amountPaise / 100);
        setPayModalVisible(true);
      }
    } catch (err: any) {
      console.error('Create order failed:', err);
      Alert.alert('Payment Error', err.data?.message || 'Failed to initialize payment gateway.');
    }
  };

  const handleCompleteMockPayment = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await verifyPayment({
        gatewayOrderId,
        gatewayPaymentId: 'pay_mock_' + Math.random().toString(36).substring(7),
        gatewaySignature: 'sig_mock_' + Math.random().toString(36).substring(7),
      }).unwrap();

      setPayModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Payment Successful', 'Transaction has been completed.');
      refetchBooking();
    } catch (err: any) {
      console.error('Payment verification failed:', err);
      Alert.alert('Verification Error', 'Failed to confirm transaction.');
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  // Lifecycle states timeline stepper
  const steps = [
    { key: 'PENDING_PROVIDER_RESPONSE', label: 'Booking Requested' },
    { key: 'PROVIDER_ACCEPTED', label: 'Provider Accepted' },
    { key: 'ON_THE_WAY', label: 'Provider En Route' },
    { key: 'ARRIVED', label: 'Provider Arrived' },
    { key: 'SERVICE_STARTED', label: 'Service Started' },
    { key: 'SERVICE_COMPLETED', label: 'Service Completed' },
    { key: 'COMPLETED', label: 'Job Finished' },
  ];

  // Check current status index
  const currentStepIndex = steps.findIndex(s => s.key === booking.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Live Map Tracking Header (Only if provider has accepted and job is active) */}
        {isActive && (
          <View style={[styles.mapHeaderContainer, { borderColor: colors.border }]}>
            <MapViewComponent
              latitude={mapLat}
              longitude={mapLng}
              title={booking.status === 'ON_THE_WAY' ? 'Provider Location (Live)' : 'Service Destination'}
              description={booking.status === 'ON_THE_WAY' ? 'Provider is en route to your address.' : 'Your registered address.'}
            />
          </View>
        )}

        {/* Booking Card summary */}
        <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>BOOKING ID: {booking._id}</Text>
          <Text style={[typography.h2, { color: colors.text, marginTop: 4, fontWeight: '800' }]}>
            {getStatusLabel(booking.status)}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Provider Assigned Details */}
          <Text style={[typography.caption, { color: colors.textSecondary }]}>PROVIDER BUSINESS</Text>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700', marginTop: 2 }]}>
            {booking.providerSnapshot?.businessName || 'Finding professional...'}
          </Text>
          
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.md }]}>SCHEDULED FOR</Text>
          <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600', marginTop: 2 }]}>
            📅 {new Date(booking.scheduledStartTime).toLocaleDateString()} at {new Date(booking.scheduledStartTime).toLocaleTimeString()}
          </Text>
        </View>

        {/* Development Mode Handshake helper banner */}
        {__DEV__ && ['ARRIVED', 'SERVICE_STARTED'].includes(booking.status) && (
          <View style={[styles.devBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            <Text style={[typography.bodySmall, { color: colors.warning, fontWeight: '800' }]}>⚠️ DEVELOPER DEBUG KEY</Text>
            <Text style={[typography.bodyMedium, { color: colors.text, marginTop: 4 }]}>
              Give this code to the Provider to advance job:
            </Text>
            <Text style={[typography.h1, { color: colors.secondary, marginTop: 4, fontWeight: '800', letterSpacing: 2 }]}>
              123456
            </Text>
          </View>
        )}

        {/* Vertical Stepper Timeline */}
        <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.lg }]}>
          Service Timeline
        </Text>
        <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.indicatorCol}>
                  <View style={[
                    styles.dot, 
                    { 
                      backgroundColor: isCompleted ? colors.secondary : colors.border,
                      transform: [{ scale: isCurrent ? 1.3 : 1 }]
                    }
                  ]} />
                  {idx < steps.length - 1 && (
                    <View style={[
                      styles.line, 
                      { backgroundColor: idx < currentStepIndex ? colors.secondary : colors.border }
                    ]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[
                    typography.bodyMedium, 
                    { 
                      color: isCompleted ? colors.text : colors.textSecondary,
                      fontWeight: isCompleted ? '700' : '400'
                    }
                  ]}>
                    {step.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Pricing Breakdown summary */}
        <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.lg }]}>
          Cost Summary
        </Text>
        <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
          <View style={styles.billRow}>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Base Rate</Text>
            <Text style={[typography.bodyMedium, { color: colors.text }]}>₹{booking.priceSnapshot?.basePrice}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Convenience Fee</Text>
            <Text style={[typography.bodyMedium, { color: colors.text }]}>₹{booking.priceSnapshot?.platformFee}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Taxes & GST</Text>
            <Text style={[typography.bodyMedium, { color: colors.text }]}>₹{booking.priceSnapshot?.taxAmount}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.billRow}>
            <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>Total Amount</Text>
            <Text style={[typography.h2, { color: colors.secondary, fontWeight: '800' }]}>₹{booking.priceSnapshot?.finalAmount}</Text>
          </View>
        </View>

        {/* Actions buttons for cancellation/rescheduling (Only if pending or accepted) */}
        {['PENDING_PROVIDER_RESPONSE', 'PROVIDER_ACCEPTED'].includes(booking.status) && (
          <View style={styles.actionGroup}>
            <Pressable 
              style={[styles.actionBtn, { borderColor: colors.primary, borderWidth: 1.5 }]}
              onPress={() => setRescheduleModalVisible(true)}
            >
              <Text style={[typography.buttonText, { color: colors.text }]}>Reschedule</Text>
            </Pressable>

            <Pressable 
              style={[styles.actionBtn, { backgroundColor: colors.danger }]}
              onPress={() => setCancelModalVisible(true)}
            >
              <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Cancel Booking</Text>
            </Pressable>
          </View>
        )}

        {/* Pay Now Action (If completed/service_completed and payment pending) */}
        {['SERVICE_COMPLETED', 'COMPLETED'].includes(booking.status) && booking.paymentStatus !== 'PAID' && (
          <View style={styles.actionGroup}>
            <Pressable 
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleTriggerPayment}
              disabled={isCreatingOrder}
            >
              {isCreatingOrder ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={[typography.buttonText, { color: colors.onPrimary }]}>Pay Now (₹{booking.priceSnapshot?.finalAmount})</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Leave Review Action (If completed and payment paid) */}
        {booking.status === 'COMPLETED' && booking.paymentStatus === 'PAID' && (
          <View style={styles.actionGroup}>
            <Pressable 
              style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({
                  pathname: '/(customer)/write-review',
                  params: {
                    bookingId: booking._id,
                    providerId: booking.providerId || '',
                    serviceId: booking.serviceId || '',
                    serviceName: booking.serviceSnapshot?.name || 'Home Service',
                    businessName: booking.providerSnapshot?.businessName || 'Service Provider',
                  }
                });
              }}
            >
              <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Leave Service Feedback</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>

      {/* 1. CANCEL BOOKING MODAL */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Cancel Booking</Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: spacing.md }]}>
              Please explain why you want to cancel this booking request:
            </Text>

            <TextInput
              style={[styles.textInput, typography.bodyMedium, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="e.g. Changed my mind / Selected wrong slot"
              placeholderTextColor={colors.textSecondary}
              value={cancelExplain}
              onChangeText={setCancelExplain}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setCancelModalVisible(false)}>
                <Text style={[typography.buttonText, { color: colors.textSecondary }]}>Dismiss</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalConfirmBtn, { backgroundColor: colors.danger }]} 
                onPress={handleCancelSubmit}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Cancel</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. RESCHEDULE BOOKING MODAL */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Reschedule Service</Text>
            
            <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary }]}>NEW DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.textInputSingle, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="2026-07-20"
              value={newDate}
              onChangeText={setNewDate}
            />

            <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>NEW TIME (HH:MM)</Text>
            <TextInput
              style={[styles.textInputSingle, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="10:00"
              value={newTime}
              onChangeText={setNewTime}
            />

            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setRescheduleModalVisible(false)}>
                <Text style={[typography.buttonText, { color: colors.textSecondary }]}>Dismiss</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]} 
                onPress={handleRescheduleSubmit}
                disabled={isRescheduling}
              >
                {isRescheduling ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[typography.buttonText, { color: colors.onPrimary }]}>Reschedule</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. RAZORPAY CHECKOUT MODAL */}
      <Modal
        visible={payModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPayModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, padding: 24 }]}>
            {/* Razorpay header logo simulation */}
            <View style={styles.payHeader}>
              <Text style={[typography.h2, { color: colors.primary, fontWeight: '800' }]}>razorpay</Text>
              <View style={[styles.payBadge, { backgroundColor: colors.secondary + '20' }]}>
                <Text style={[typography.caption, { color: colors.secondary, fontWeight: '700' }]}>SECURE</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[typography.caption, { color: colors.textSecondary }]}>ORDER REFERENCE ID</Text>
            <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700', marginTop: 2 }]} numberOfLines={1}>
              {gatewayOrderId}
            </Text>

            <View style={styles.paymentSummary}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Amount to Pay</Text>
              <Text style={[typography.h1, { color: colors.text, fontWeight: '800' }]}>₹{payAmount}</Text>
            </View>

            <Pressable 
              style={[styles.payBtnSubmit, { backgroundColor: colors.secondary }]}
              onPress={handleCompleteMockPayment}
              disabled={isVerifyingPayment}
            >
              {isVerifyingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Simulate Payment Success</Text>
              )}
            </Pressable>

            <Pressable 
              style={[styles.payBtnDismiss, { marginTop: spacing.md }]} 
              onPress={() => setPayModalVisible(false)}
            >
              <Text style={[typography.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
  mapHeaderContainer: {
    height: 180,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  scroll: {
    padding: 24,
  },
  detailsCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  devBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '700',
  },
  timelineCard: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicatorCol: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  line: {
    width: 2.5,
    height: 38,
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 24,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
  },
  textInput: {
    height: 80,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  textInputSingle: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  modalLabel: {
    fontWeight: '700',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalConfirmBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentSummary: {
    alignItems: 'center',
    marginVertical: 24,
  },
  payBtnSubmit: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnDismiss: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
