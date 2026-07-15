import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/hooks/useTheme';
import { useGetAddressesQuery } from '@/redux/api/profileApi';
import { useCreateBookingMutation } from '@/redux/api/bookingApi';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

// Validation Schema
const bookingSchema = z.object({
  bookingType: z.enum(['INSTANT', 'SCHEDULED']),
  date: z.string().optional(),
  time: z.string().optional(),
  additionalNotes: z.string().optional(),
  couponCode: z.string().optional(),
});

type FormData = z.infer<typeof bookingSchema>;

export default function BookServiceScreen() {
  const { colors, typography, spacing, border } = useTheme();
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
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  // API Queries & Mutations
  const { data: addressesRes, isLoading: isAddressesLoading } = useGetAddressesQuery();
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();

  const addresses = addressesRes?.data || [];
  const basePrice = Number(params.price || 499);
  
  // Dynamic pricing calculations
  const platformFee = 29;
  const taxRate = 0.18;
  const taxableAmount = Math.max(0, basePrice - discountAmount);
  const taxAmount = Math.round(taxableAmount * taxRate);
  const finalAmount = taxableAmount + taxAmount + platformFee;

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingType: 'INSTANT',
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      additionalNotes: '',
      couponCode: '',
    }
  });

  const bookingType = watch('bookingType');
  const enteredCoupon = watch('couponCode');

  // Pre-select primary address
  useEffect(() => {
    if (addresses.length > 0) {
      const primary = addresses.find(a => a.isPrimary) || addresses[0];
      setSelectedAddressId(primary._id || primary.id || null);
    }
  }, [addresses]);

  const handleApplyCoupon = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (enteredCoupon?.toUpperCase() === 'TAP20') {
      const discount = Math.round(basePrice * 0.2); // 20% discount
      setDiscountAmount(discount);
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code');
      setDiscountAmount(0);
      setCouponApplied(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const activeAddress = addresses.find(a => (a._id || a.id) === selectedAddressId);
    if (!activeAddress) {
      alert('Please select a delivery address');
      return;
    }

    try {
      // Resolve start/end times
      let start = new Date();
      if (data.bookingType === 'SCHEDULED' && data.date && data.time) {
        start = new Date(`${data.date}T${data.time}:00.000Z`);
      }
      
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

      const bookingPayload = {
        serviceId: params.serviceId,
        providerServiceId: params.providerServiceId,
        bookingType: data.bookingType,
        scheduledStartTime: start.toISOString(),
        scheduledEndTime: end.toISOString(),
        couponCode: couponApplied ? 'TAP20' : '',
        couponDiscountAmount: discountAmount,
        customerAddressSnapshot: {
          label: activeAddress.label,
          addressLine1: activeAddress.addressLine1,
          addressLine2: activeAddress.addressLine2,
          city: activeAddress.city,
          state: activeAddress.state,
          pincode: activeAddress.pincode,
          location: {
            type: 'Point' as const,
            coordinates: [activeAddress.longitude, activeAddress.latitude],
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
    }
  };

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
            <Text style={[typography.bodyMedium, { color: colors.secondary, fontWeight: '700' }]}>{params.serviceName}</Text>
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

          {/* 3. Coupon Codes Input */}
          <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.lg }]}>
            Apply Promo Code
          </Text>
          <View style={styles.couponRow}>
            <Controller
              control={control}
              name="couponCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.couponInput, 
                    typography.bodyLarge, 
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: couponError ? colors.danger : colors.border,
                      color: colors.text
                    }
                  ]}
                  placeholder="Enter Promo Code"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            <Pressable 
              style={[styles.couponBtn, { backgroundColor: colors.secondary }]}
              onPress={handleApplyCoupon}
            >
              <Text style={[typography.buttonText, { color: colors.onSecondary, fontSize: 14 }]}>Apply</Text>
            </Pressable>
          </View>
          {couponApplied && (
            <Text style={[typography.bodySmall, { color: colors.secondary, marginTop: 4, fontWeight: '600' }]}>
              Success! 20% discount applied.
            </Text>
          )}
          {couponError !== '' && (
            <Text style={[typography.bodySmall, { color: colors.danger, marginTop: 4 }]}>
              {couponError}
            </Text>
          )}

          {/* 4. Notes input */}
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
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          {/* 5. Cost Summary Card */}
          <View style={[styles.billCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Price Details</Text>
            
            <View style={styles.billRow}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Service Rate</Text>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>₹{basePrice}</Text>
            </View>
            
            {couponApplied && (
              <View style={styles.billRow}>
                <Text style={[typography.bodyMedium, { color: colors.secondary }]}>TAP20 Discount (20%)</Text>
                <Text style={[typography.bodyMedium, { color: colors.secondary }]}>- ₹{discountAmount}</Text>
              </View>
            )}

            <View style={styles.billRow}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Taxes & GST (18%)</Text>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>₹{taxAmount}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Convenience Fee</Text>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>₹{platformFee}</Text>
            </View>

            <View style={[styles.billDivider, { backgroundColor: colors.border }]} />

            <View style={styles.billRow}>
              <Text style={[typography.h2, { color: colors.text, fontWeight: '700' }]}>Total Amount</Text>
              <Text style={[typography.h1, { color: colors.secondary, fontWeight: '800' }]}>₹{finalAmount}</Text>
            </View>
          </View>

          {/* Place Booking Trigger */}
          <Pressable
            style={[styles.bookingBtn, { backgroundColor: colors.primary, marginTop: spacing.xl }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isCreatingBooking}
          >
            {isCreatingBooking ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={[typography.buttonText, { color: colors.onPrimary }]}>
                {bookingType === 'INSTANT' ? 'Book Instantly' : 'Confirm Scheduled Booking'}
              </Text>
            )}
          </Pressable>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
});
