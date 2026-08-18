import React, { useState, useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, View, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/hooks/useTheme';
import { useGetAddressesQuery } from '@/redux/api/profileApi';
import { useGetServiceByIdQuery } from '@/redux/api/serviceApi';
import { useCreateBookingMutation } from '@/redux/api/bookingApi';
import * as Haptics from 'expo-haptics';
import { getRequiredDeviceLocation } from '@/hooks/useDeviceLocation';

// Validation Schema
const bookingSchema = z.object({
  bookingType: z.enum(['INSTANT', 'SCHEDULED']),
  date: z.string().optional(),
  time: z.string().optional(),
  additionalNotes: z.string().max(500, 'Description must be 500 characters or fewer.').optional(),
});

type FormData = z.infer<typeof bookingSchema>;

export default function BookServiceScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    providerId: string;
    providerServiceId: string;
    businessName: string;
    price: string;
    serviceId: string;
    serviceName: string;
  }>();

  // Selected Address State
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<FormData | null>(null);
  const [confirmationKey, setConfirmationKey] = useState<string | null>(null);
  const submissionLock = useRef(false);
  // API Queries & Mutations
  const { data: addressesRes, isLoading: isAddressesLoading } = useGetAddressesQuery();
  const serviceQuery = useGetServiceByIdQuery(params.serviceId ?? '', { skip: !params.serviceId });
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();

  const addresses = addressesRes?.data || [];
  const basePrice = Number(params.price);
  const hasValidPrice = Number.isFinite(basePrice) && basePrice > 0;
  const service = serviceQuery.data?.data;
  const serviceDurationMinutes = service?.estimatedDuration;

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingType: 'INSTANT',
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      additionalNotes: '',
    }
  });

  const bookingType = watch('bookingType');

  // Pre-select primary address
  useEffect(() => {
    if (addresses.length > 0) {
      const primary = addresses.find(a => a.isPrimary) || addresses[0];
      setSelectedAddressId(primary._id || primary.id || null);
    }
  }, [addresses]);

  const createBookingRequest = async (data: FormData, idempotencyKey: string | null) => {
    if (submissionLock.current) return;
    submissionLock.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const activeAddress = addresses.find(a => (a._id || a.id) === selectedAddressId);
    if (!activeAddress) {
      Alert.alert('Address required', 'Please select a saved service address before booking.');
      submissionLock.current = false;
      return;
    }

    if (!idempotencyKey || !params.serviceId || !params.providerServiceId || !service || !service.isActive || !hasValidPrice || !serviceDurationMinutes) {
      Alert.alert('Service unavailable', 'This service no longer has a valid provider offer. Please return to search and select a provider again.');
      submissionLock.current = false;
      return;
    }

    const deviceLocation = await getRequiredDeviceLocation();
    if (!deviceLocation) {
      submissionLock.current = false;
      return;
    }

    try {
      // Resolve start/end times
      let start = new Date(Date.now() + 20 * 60 * 1000);
      if (data.bookingType === 'SCHEDULED' && data.date && data.time) {
        start = new Date(`${data.date}T${data.time}:00.000Z`);
      }
      if (Number.isNaN(start.getTime()) || start <= new Date()) {
        Alert.alert('Invalid schedule', 'Choose a valid future date and time.');
        submissionLock.current = false;
        return;
      }
      
      const end = new Date(start.getTime() + serviceDurationMinutes * 60 * 1000);

      const bookingPayload = {
        idempotencyKey,
        serviceId: params.serviceId,
        providerServiceId: params.providerServiceId,
        bookingType: data.bookingType,
        scheduledStartTime: start.toISOString(),
        scheduledEndTime: end.toISOString(),
        customerAddressSnapshot: {
          label: activeAddress.label,
          addressLine1: activeAddress.addressLine1,
          addressLine2: activeAddress.addressLine2,
          city: activeAddress.city,
          state: activeAddress.state,
          pincode: activeAddress.pincode,
          location: {
            type: 'Point' as const,
            coordinates: [deviceLocation.longitude, deviceLocation.latitude] as [number, number],
          }
        },
        additionalNotes: data.additionalNotes || undefined
      };

      const response = await createBooking(bookingPayload).unwrap();
      if (response.success && response.data) {
        router.push({
          pathname: '/(customer)/booking-success',
          params: { bookingId: response.data._id || response.data.id }
        });
      }
    } catch (err: any) {
      console.error('Booking submission failed:', err);
      Alert.alert('Booking not confirmed', err?.data?.message || (err?.status ? 'Your booking was not created. Please try again.' : 'We could not confirm whether the request reached the server. Check My Bookings before retrying to avoid a duplicate booking.'));
    } finally {
      submissionLock.current = false;
    }
  };

  const openConfirmation = (data: FormData) => {
    if (!selectedAddressId || !service || !service.isActive || !hasValidPrice) {
      Alert.alert('Booking details incomplete', 'Select a valid address and service before confirming.');
      return;
    }
    setConfirmation(data);
    // Keep the same key after an uncertain network result. A retry therefore
    // resolves to the original booking instead of submitting a second one.
    setConfirmationKey((currentKey) => currentKey || `booking-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`);
  };

  const selectedAddress = addresses.find((address) => (address._id || address.id) === selectedAddressId);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.container, { padding: spacing.lg }]}>
          
          {/* Header Summary */}
          <View style={styles.summaryCard}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>BOOKING SERVICE WITH</Text>
            <Text style={[typography.h2, { color: colors.text, marginTop: 4 }]}>{params.businessName}</Text>
            <Text style={[typography.bodyMedium, { color: colors.secondary, fontWeight: '700' }]}>{service?.name || params.serviceName}</Text>
            {serviceQuery.isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : service && <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>{service.estimatedDuration} minutes estimated</Text>}
          </View>

          {/* 1. Address Selection */}
          <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.md }]}>
            Select Address
          </Text>
          
          {isAddressesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : addresses.length === 0 ? (
            <Pressable 
              style={[styles.addressCard, { borderColor: colors.border, borderStyle: 'dashed' }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>No saved addresses. Add one in Profile.</Text>
            </Pressable>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((addr) => {
                const id = addr._id || addr.id;
                const isSelected = selectedAddressId === id;
                return (
                  <Pressable
                    key={id}
                    style={[
                      styles.addressCard,
                      { 
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1 
                      }
                    ]}
                    onPress={() => setSelectedAddressId(id || null)}
                  >
                    <View style={styles.radioRow}>
                      <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700', textTransform: 'capitalize' }]}>
                        🏠 {addr.label}
                      </Text>
                      <View style={[styles.radioCircle, { borderColor: isSelected ? colors.primary : colors.textSecondary }]}>
                        {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                      </View>
                    </View>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={2}>
                      {addr.addressLine1}, {addr.addressLine2 || ''}, {addr.city} - {addr.pincode}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* 2. Booking Type Toggle */}
          <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.lg }]}>
            Choose Schedule
          </Text>
          <Controller
            control={control}
            name="bookingType"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceVariant }]}>
                <Pressable
                  style={[styles.toggleButton, value === 'INSTANT' && { backgroundColor: colors.primary }]}
                  onPress={() => onChange('INSTANT')}
                >
                  <Text style={[typography.bodyMedium, { color: value === 'INSTANT' ? colors.onPrimary : colors.textSecondary, fontWeight: '600' }]}>
                    Instant Booking
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleButton, value === 'SCHEDULED' && { backgroundColor: colors.primary }]}
                  onPress={() => onChange('SCHEDULED')}
                >
                  <Text style={[typography.bodyMedium, { color: value === 'SCHEDULED' ? colors.onPrimary : colors.textSecondary, fontWeight: '600' }]}>
                    Schedule Later
                  </Text>
                </Pressable>
              </View>
            )}
          />

          {/* Date & Time fields if SCHEDULED */}
          {bookingType === 'SCHEDULED' && (
            <View style={styles.dateTimeRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary }]}>DATE (YYYY-MM-DD)</Text>
                <Controller
                  control={control}
                  name="date"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      placeholder="YYYY-MM-DD"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary }]}>TIME (HH:MM)</Text>
                <Controller
                  control={control}
                  name="time"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      placeholder="12:00"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
            </View>
          )}

          {/* Promotions are intentionally omitted until server-side validation and redemption are available. */}

          {/* 3. Notes input */}
          <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.lg }]}>
            Additional Notes
          </Text>
          <Controller
            control={control}
            name="additionalNotes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.notesInput, 
                  typography.bodyMedium, 
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }
                ]}
                placeholder="e.g. Please ring bell, bring a ladder..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                maxLength={500}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>Maximum 500 characters. This is also validated by the backend.</Text>

          {/* 4. Cost Summary Card */}
          <View style={[styles.billCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Price Details</Text>
            
            <View style={styles.billRow}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Service Rate</Text>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>{hasValidPrice ? `₹${basePrice}` : 'Unavailable'}</Text>
            </View>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>The final price, taxes, travel charge, and eligible promotions are calculated securely by the server when the booking is created.</Text>
          </View>

          {/* Place Booking Trigger */}
          <Pressable
            style={[styles.bookingBtn, { backgroundColor: colors.primary, marginTop: spacing.xl }]}
            onPress={handleSubmit(openConfirmation)}
            disabled={isCreatingBooking || serviceQuery.isLoading || !service?.isActive}
          >
            {isCreatingBooking ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={[typography.buttonText, { color: colors.onPrimary }]}>
                {bookingType === 'INSTANT' ? 'Book Instantly' : 'Confirm Scheduled Booking'}
              </Text>
            )}
          </Pressable>

          {confirmation && selectedAddress && service && (
            <View style={[styles.confirmationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.h3, { color: colors.text }]}>Review your booking</Text>
              <SummaryRow label="Service" value={service.name} />
              <SummaryRow label="Provider" value={params.businessName} />
              <SummaryRow label="Address" value={`${selectedAddress.addressLine1}, ${selectedAddress.city}`} />
              <SummaryRow label="Schedule" value={confirmation.bookingType === 'INSTANT' ? 'Instant booking' : `${confirmation.date} ${confirmation.time}`} />
              <SummaryRow label="Duration" value={`${service.estimatedDuration} minutes`} />
              <SummaryRow label="Provider offer" value={`₹${basePrice}`} />
              <SummaryRow label="Notes" value={confirmation.additionalNotes?.trim() || 'None'} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>The final total and provider availability are verified by the server.</Text>
              <View style={styles.confirmActions}>
                <Pressable onPress={() => { setConfirmation(null); setConfirmationKey(null); }} style={[styles.editBtn, { borderColor: colors.border }]}><Text style={{ color: colors.text }}>Edit</Text></Pressable>
                <Pressable onPress={() => { const data = confirmation; const key = confirmationKey; setConfirmation(null); void createBookingRequest(data, key); }} disabled={isCreatingBooking} style={[styles.confirmBtn, { backgroundColor: colors.primary }]}>{isCreatingBooking ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Confirm booking</Text>}</Pressable>
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '700',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  addressList: {
    gap: 12,
  },
  addressCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  couponBtn: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  notesInput: {
    height: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  billCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billDivider: {
    height: 1,
    marginVertical: 12,
  },
  bookingBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmationCard: { marginTop: 18, borderRadius: 16, borderWidth: 1, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  summaryLabel: { color: '#64748B', flex: 1 },
  summaryValue: { color: '#0F172A', flex: 1, textAlign: 'right', fontWeight: '600' },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  editBtn: { flex: 1, height: 46, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
