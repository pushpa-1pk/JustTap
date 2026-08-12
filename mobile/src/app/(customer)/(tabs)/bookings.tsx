import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  FlatList,
  Animated,
  Platform,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useGetCustomerBookingsQuery,
  useCancelBookingMutation,
  useRescheduleBookingMutation,
  Booking
} from '@/redux/api/bookingApi';
import Shimmer from '@/components/common/Shimmer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GRID = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  radiusCard: 20,
};

const BRAND_COLORS = {
  background: '#FFFFFF',
  secondaryBg: '#FFF9F0',
  primary: '#16A34A', // Green Action / Success
  accent: '#FBBF24', // Yellow Accent
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  darkText: '#0F172A',
  secondaryText: '#64748B',
  divider: '#E5E7EB',
};

// Premium press-to-scale component
const ScalePressable = ({ onPress, style, children, disabled }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) onPress();
      }}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function CustomerBookingsScreen() {
  const { typography, colors } = useTheme();
  const router = useRouter();

  // RTK Query Hooks for Booking Microservice
  const { data: bookingsRes, isLoading: isBookingsLoading, refetch, isError } = useGetCustomerBookingsQuery();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();
  const [rescheduleBooking, { isLoading: isRescheduling }] = useRescheduleBookingMutation();

  const bookings = bookingsRes?.data || [];

  // Local UI & Sandbox States
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'EMERGENCY'>('ALL');
  const [devState, setDevState] = useState<'normal' | 'empty' | 'no-internet' | 'loading'>('normal');
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  // Bottom Sheets control
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);
  const [isRescheduleSheetOpen, setIsRescheduleSheetOpen] = useState(false);
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);

  // Local Ratings updates
  const [localRatings, setLocalRatings] = useState<Record<string, number>>({});

  // Reschedule Form Local States
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState<'TOMORROW' | 'NEXT_DAY'>('TOMORROW');
  const [selectedRescheduleTime, setSelectedRescheduleTime] = useState('10:00 AM');

  // Cancel Form Local States
  const [cancelReason, setCancelReason] = useState('Change of plans');

  // Pull to Refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter chips list
  const filterChips = [
    { id: 'ALL', label: 'All' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'EMERGENCY', label: 'Emergency 🚨' }
  ];

  // Helper: Categorize & filter bookings list
  const listData = useMemo(() => {
    if (devState === 'empty') return [];

    let filtered = [...bookings];

    // Filter by Search Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        (b.providerSnapshot?.businessName || '').toLowerCase().includes(q) ||
        (b._id || '').toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q)
      );
    }

    // Filter by Chips Tab
    if (selectedFilter !== 'ALL') {
      if (selectedFilter === 'ACTIVE') {
        filtered = filtered.filter(b => 
          ['PROVIDER_ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(b.status)
        );
      } else if (selectedFilter === 'UPCOMING') {
        filtered = filtered.filter(b => 
          ['REQUESTED', 'PENDING_PROVIDER_RESPONSE'].includes(b.status)
        );
      } else if (selectedFilter === 'COMPLETED') {
        filtered = filtered.filter(b => b.status === 'COMPLETED');
      } else if (selectedFilter === 'CANCELLED') {
        filtered = filtered.filter(b => b.status === 'CANCELLED' || b.status === 'FAILED');
      } else if (selectedFilter === 'EMERGENCY') {
        filtered = filtered.filter(b => b.bookingType === 'INSTANT');
      }
    }

    return filtered;
  }, [bookings, searchQuery, selectedFilter, devState]);

  // Counts for Summary Card
  const summaryMetrics = useMemo(() => {
    const active = bookings.filter(b => 
      ['PROVIDER_ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(b.status)
    ).length;
    const upcoming = bookings.filter(b => 
      ['REQUESTED', 'PENDING_PROVIDER_RESPONSE'].includes(b.status)
    ).length;
    const completed = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;

    return { active, upcoming, completed, cancelled };
  }, [bookings]);

  // Handle Booking Cancellation
  const handleConfirmCancellation = () => {
    if (!selectedBookingForAction) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    cancelBooking({
      id: selectedBookingForAction._id,
      reasonCode: 'CUSTOMER_CANCELLED',
      customExplanation: cancelReason
    })
      .unwrap()
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsCancelSheetOpen(false);
        setSelectedBookingForAction(null);
        refetch();
      })
      .catch(err => console.error("Cancel booking failed:", err));
  };

  // Handle Rescheduling Booking
  const handleConfirmReschedule = () => {
    if (!selectedBookingForAction) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Calculate dates
    const date = new Date();
    if (selectedRescheduleDate === 'TOMORROW') {
      date.setDate(date.getDate() + 1);
    } else {
      date.setDate(date.getDate() + 2);
    }
    
    const [hours, minutes] = selectedRescheduleTime.replace(' AM', '').replace(' PM', '').split(':');
    let h = parseInt(hours);
    if (selectedRescheduleTime.includes('PM') && h < 12) h += 12;
    date.setHours(h, parseInt(minutes), 0, 0);

    const newStartTime = date.toISOString();
    const newEndTime = new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours duration

    rescheduleBooking({
      id: selectedBookingForAction._id,
      newStartTime,
      newEndTime,
      reasonCode: 'CLIENT_SCHEDULE_CONFLICT',
      customExplanation: 'Rescheduled from bookings tab calendar picker'
    })
      .unwrap()
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsRescheduleSheetOpen(false);
        setSelectedBookingForAction(null);
        refetch();
      })
      .catch(err => console.error("Rescheduling booking failed:", err));
  };

  const handleRateBooking = (bookingId: string, rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalRatings(prev => ({ ...prev, [bookingId]: rating }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Color mappings for booking statuses
  const getStatusBadgeMeta = (status: string) => {
    switch (status) {
      case 'REQUESTED':
      case 'PENDING_PROVIDER_RESPONSE':
        return { label: 'Awaiting Provider', bg: BRAND_COLORS.warning + '20', text: BRAND_COLORS.warning, percent: 15 };
      case 'PROVIDER_ACCEPTED':
        return { label: 'Assigned', bg: BRAND_COLORS.primary + '20', text: BRAND_COLORS.primary, percent: 35 };
      case 'ON_THE_WAY':
        return { label: 'On The Way', bg: BRAND_COLORS.warning + '20', text: BRAND_COLORS.warning, percent: 55 };
      case 'ARRIVED':
        return { label: 'Arrived', bg: BRAND_COLORS.primary + '20', text: BRAND_COLORS.primary, percent: 75 };
      case 'SERVICE_STARTED':
        return { label: 'In Progress', bg: BRAND_COLORS.success + '20', text: BRAND_COLORS.success, percent: 90 };
      case 'SERVICE_COMPLETED':
      case 'COMPLETED':
        return { label: 'Completed', bg: BRAND_COLORS.success + '20', text: BRAND_COLORS.success, percent: 100 };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: BRAND_COLORS.error + '20', text: BRAND_COLORS.error, percent: 0 };
      default:
        return { label: status, bg: '#F1F5F9', text: BRAND_COLORS.secondaryText, percent: 0 };
    }
  };

  // Screen State Renderers
  if (devState === 'loading' || isBookingsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: BRAND_COLORS.background }]}>
        <View style={styles.header}>
          <Shimmer width={180} height={28} borderRadius={4} />
          <Shimmer width={44} height={44} borderRadius={14} />
        </View>
        <ScrollView style={{ paddingHorizontal: 24, paddingTop: GRID.md }}>
          <Shimmer width={'100%'} height={48} borderRadius={14} style={{ marginBottom: GRID.lg }} />
          <Shimmer width={'100%'} height={80} borderRadius={18} style={{ marginBottom: GRID.xl }} />
          <Shimmer width={'100%'} height={180} borderRadius={GRID.radiusCard} style={{ marginBottom: GRID.lg }} />
          <Shimmer width={'100%'} height={120} borderRadius={GRID.radiusCard} />
        </ScrollView>
        {renderDevMenu()}
      </View>
    );
  }

  if (devState === 'no-internet' || isError) {
    return renderEmptyState(
      'cloud-offline-outline',
      'Unable to connect',
      'Please check your network and try again. Database bookings records could not be loaded.',
      'Retry Connection',
      () => {
        setDevState('normal');
        refetch();
      }
    );
  }

  // --- Normal / Bookings View ---
  return (
    <View style={{ flex: 1, backgroundColor: BRAND_COLORS.background }}>
      {/* TOP HEADER */}
      <View style={styles.header}>
        <Text style={[typography.h1, { color: BRAND_COLORS.darkText, fontSize: 26, fontWeight: '800' }]}>My Bookings</Text>
        <ScalePressable style={styles.headerIconButton} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color={BRAND_COLORS.darkText} />
          <View style={styles.notificationBadge} />
        </ScalePressable>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBarBox}>
        <Ionicons name="search" size={20} color={BRAND_COLORS.secondaryText} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: BRAND_COLORS.darkText }]}
          placeholder="Search by service, provider, or ID..."
          placeholderTextColor={BRAND_COLORS.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={BRAND_COLORS.secondaryText} />
          </Pressable>
        )}
      </View>

      {/* FILTER CHIPS ROW */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
          {filterChips.map(chip => (
            <Pressable
              key={chip.id}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: selectedFilter === chip.id ? BRAND_COLORS.secondaryBg : '#FFFFFF',
                  borderColor: selectedFilter === chip.id ? BRAND_COLORS.accent : BRAND_COLORS.divider
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter(chip.id as any);
              }}
            >
              <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_COLORS.primary} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderSummaryCard}
        ListEmptyComponent={renderEmptyStateInline}
        renderItem={({ item }) => {
          const isEmergency = item.bookingType === 'INSTANT';
          const meta = getStatusBadgeMeta(item.status);

          // 1. ACTIVE BOOKING RENDERER
          if (['PROVIDER_ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(item.status)) {
            return (
              <View style={[styles.bookingCard, { borderColor: BRAND_COLORS.divider }]}>
                {/* Emergency Tag */}
                {isEmergency && (
                  <View style={[styles.emergencyTag, { backgroundColor: BRAND_COLORS.error + '15' }]}>
                    <Ionicons name="alert-circle" size={14} color={BRAND_COLORS.error} />
                    <Text style={[typography.caption, { color: BRAND_COLORS.error, fontWeight: '800', marginLeft: 4 }]}>
                      EMERGENCY ACTIVE • PRIORITY DISPATCH
                    </Text>
                  </View>
                )}

                <View style={styles.cardHeaderRow}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150' }} style={styles.proPhoto} />
                  <View style={{ flex: 1, marginLeft: GRID.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                        {item.providerSnapshot?.businessName || 'Assigned Specialist'}
                      </Text>
                      <Ionicons name="checkmark-circle" size={16} color={BRAND_COLORS.primary} style={{ marginLeft: 4 }} />
                    </View>
                    <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2 }]}>
                      Booking BK-{(item._id || '').slice(-5).toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Text style={[typography.caption, { color: meta.text, fontWeight: '800' }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>

                {/* Progress track timeline */}
                <View style={styles.progressRow}>
                  <View style={styles.progressTrackContainer}>
                    <View style={styles.progressTrack} />
                    <View style={[styles.progressTrackFill, { width: `${meta.percent}%`, backgroundColor: BRAND_COLORS.primary }]} />
                  </View>
                  <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: GRID.xs }]}>
                    {meta.percent}% Tracked • Provider ETA: 8 mins
                  </Text>
                </View>

                <View style={styles.cardFooterRow}>
                  <View>
                    <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>ESTIMATED PRICE</Text>
                    <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                      ₹{item.priceSnapshot?.finalAmount}
                    </Text>
                  </View>
                  <View style={styles.cardActionRow}>
                    <ScalePressable
                      style={[styles.smallActionBtn, { backgroundColor: BRAND_COLORS.accent }]}
                      onPress={() => router.push({ pathname: '/(customer)/booking-details', params: { bookingId: item._id } })}
                    >
                      <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Track Live</Text>
                    </ScalePressable>
                    <ScalePressable
                      style={[styles.smallIconBtn, { borderColor: BRAND_COLORS.divider }]}
                      onPress={() => {}}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={BRAND_COLORS.darkText} />
                    </ScalePressable>
                    <ScalePressable
                      style={[styles.smallIconBtn, { borderColor: BRAND_COLORS.divider }]}
                      onPress={() => {
                        setSelectedBookingForAction(item);
                        setIsCancelSheetOpen(true);
                      }}
                    >
                      <Ionicons name="close-circle-outline" size={18} color={BRAND_COLORS.error} />
                    </ScalePressable>
                  </View>
                </View>
              </View>
            );
          }

          // 2. UPCOMING APPOINTMENTS
          if (['REQUESTED', 'PENDING_PROVIDER_RESPONSE'].includes(item.status)) {
            return (
              <View style={[styles.bookingCard, { borderColor: BRAND_COLORS.divider }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.dateBlock, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
                    <Text style={[typography.bodyMedium, { color: BRAND_COLORS.accent, fontWeight: '800' }]}>TOM</Text>
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>10:00</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: GRID.md }}>
                    <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                      Awaiting AC Servicing
                    </Text>
                    <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2 }]}>
                      Booking BK-{(item._id || '').slice(-5).toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Text style={[typography.caption, { color: meta.text, fontWeight: '800' }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.upcomingDetails}>
                  <Ionicons name="location-outline" size={16} color={BRAND_COLORS.secondaryText} />
                  <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginLeft: 4, flex: 1 }]} numberOfLines={1}>
                    {item.customerAddressSnapshot?.addressLine1 || 'Home, Mumbai'}
                  </Text>
                </View>

                <View style={styles.cardFooterRow}>
                  <View>
                    <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>UPFRONT BUDGET</Text>
                    <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                      ₹{item.priceSnapshot?.finalAmount}
                    </Text>
                  </View>
                  <View style={styles.cardActionRow}>
                    <ScalePressable
                      style={[styles.smallActionBtn, { borderColor: BRAND_COLORS.divider }]}
                      onPress={() => {
                        setSelectedBookingForAction(item);
                        setIsRescheduleSheetOpen(true);
                      }}
                    >
                      <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>Reschedule</Text>
                    </ScalePressable>
                    <ScalePressable
                      style={[styles.smallActionBtn, { borderColor: BRAND_COLORS.error }]}
                      onPress={() => {
                        setSelectedBookingForAction(item);
                        setIsCancelSheetOpen(true);
                      }}
                    >
                      <Text style={[typography.caption, { color: BRAND_COLORS.error, fontWeight: '700' }]}>Cancel</Text>
                    </ScalePressable>
                  </View>
                </View>
              </View>
            );
          }

          // 3. COMPLETED BOOKINGS
          if (item.status === 'COMPLETED') {
            const currentRating = localRatings[item._id] || 0;
            return (
              <View style={[styles.bookingCard, { borderColor: BRAND_COLORS.divider }]}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="checkmark-circle-sharp" size={32} color={BRAND_COLORS.primary} />
                  <View style={{ flex: 1, marginLeft: GRID.md }}>
                    <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                      Home Deep Cleaning
                    </Text>
                    <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>
                      Completed • {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[typography.h3, { color: BRAND_COLORS.primary, fontWeight: '800' }]}>
                    ₹{item.priceSnapshot?.finalAmount}
                  </Text>
                </View>

                {/* Rating selection reminders */}
                <View style={[styles.ratingPanel, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                    {currentRating > 0 ? 'Thanks for rating!' : 'Rate your experience'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: GRID.xs }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Pressable key={star} onPress={() => handleRateBooking(item._id, star)}>
                        <Ionicons
                          name={star <= currentRating ? 'star' : 'star-outline'}
                          size={20}
                          color={BRAND_COLORS.accent}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>
                    Paid via {item.paymentStatus === 'PAID' ? 'Wallet' : 'Cash'}
                  </Text>
                  <View style={styles.cardActionRow}>
                    <ScalePressable
                      style={[styles.smallActionBtn, { borderColor: BRAND_COLORS.divider }]}
                      onPress={() => {}}
                    >
                      <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>Invoice</Text>
                    </ScalePressable>
                    <ScalePressable
                      style={[styles.smallActionBtn, { backgroundColor: BRAND_COLORS.accent }]}
                      onPress={() => router.push('/search')}
                    >
                      <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Book Again</Text>
                    </ScalePressable>
                  </View>
                </View>
              </View>
            );
          }

          // 4. CANCELLED APPOINTMENTS
          return (
            <View style={[styles.bookingCard, { borderColor: BRAND_COLORS.divider, opacity: 0.85 }]}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="close-circle-sharp" size={32} color={BRAND_COLORS.error} />
                <View style={{ flex: 1, marginLeft: GRID.md }}>
                  <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                    Plumbing Repair
                  </Text>
                  <Text style={[typography.caption, { color: BRAND_COLORS.error, fontWeight: '700' }]}>
                    Cancelled • Refund Completed
                  </Text>
                </View>
                <Text style={[typography.h3, { color: BRAND_COLORS.secondaryText, textDecorationLine: 'line-through' }]}>
                  ₹{item.priceSnapshot?.finalAmount}
                </Text>
              </View>

              <View style={[styles.refundCard, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
                <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]} numberOfLines={1}>
                  Refund status: <Text style={{ color: BRAND_COLORS.primary, fontWeight: '800' }}>Credited to Wallet</Text> • ₹{item.priceSnapshot?.finalAmount}
                </Text>
              </View>

              <View style={styles.cardFooterRow}>
                <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>
                  Reason: {item.additionalNotes || 'Cancelled by customer'}
                </Text>
                <View style={styles.cardActionRow}>
                  <ScalePressable
                    style={[styles.smallActionBtn, { borderColor: BRAND_COLORS.divider }]}
                    onPress={() => {}}
                  >
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>Support</Text>
                  </ScalePressable>
                  <ScalePressable
                    style={[styles.smallActionBtn, { backgroundColor: BRAND_COLORS.accent }]}
                    onPress={() => router.push('/search')}
                  >
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Rebook</Text>
                  </ScalePressable>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* EMERGENCY BOOKING FAB OVERLAY */}
      {selectedFilter === 'EMERGENCY' && (
        <View style={styles.emergencyBanner}>
          <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '800' }]}>
            🚨 Emergency Jobs Dispatched In Real-Time
          </Text>
        </View>
      )}

      {/* RESCHEDULE BOTTOM SHEET MODAL */}
      <Modal visible={isRescheduleSheetOpen} transparent animationType="slide">
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsRescheduleSheetOpen(false)} />
          <View style={[styles.bottomSheetContainer, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: BRAND_COLORS.darkText }]}>Reschedule Appointment</Text>
              <Pressable onPress={() => setIsRescheduleSheetOpen(false)}>
                <Ionicons name="close" size={24} color={BRAND_COLORS.darkText} />
              </Pressable>
            </View>

            <View style={{ padding: GRID.lg }}>
              <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginBottom: GRID.sm }]}>Choose Date</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: GRID.lg }}>
                <Pressable
                  style={[
                    styles.dateSelectBtn,
                    selectedRescheduleDate === 'TOMORROW' ? { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent } : { borderColor: BRAND_COLORS.divider }
                  ]}
                  onPress={() => setSelectedRescheduleDate('TOMORROW')}
                >
                  <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Tomorrow</Text>
                  <Text style={typography.caption}>Aug 8th</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.dateSelectBtn,
                    selectedRescheduleDate === 'NEXT_DAY' ? { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent } : { borderColor: BRAND_COLORS.divider }
                  ]}
                  onPress={() => setSelectedRescheduleDate('NEXT_DAY')}
                >
                  <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Day After</Text>
                  <Text style={typography.caption}>Aug 9th</Text>
                </Pressable>
              </View>

              <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginBottom: GRID.sm }]}>Available Slots</Text>
              <View style={styles.timeSlotsRow}>
                {['09:00 AM', '10:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'].map(time => (
                  <Pressable
                    key={time}
                    style={[
                      styles.timeSlotChip,
                      selectedRescheduleTime === time ? { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent } : { borderColor: BRAND_COLORS.divider }
                    ]}
                    onPress={() => setSelectedRescheduleTime(time)}
                  >
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>{time}</Text>
                  </Pressable>
                ))}
              </View>

              <ScalePressable
                disabled={isRescheduling}
                style={[styles.confirmRescheduleBtn, { backgroundColor: BRAND_COLORS.accent }]}
                onPress={handleConfirmReschedule}
              >
                {isRescheduling ? (
                  <ActivityIndicator size="small" color={BRAND_COLORS.darkText} />
                ) : (
                  <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                    Confirm Rescheduling Appointment
                  </Text>
                )}
              </ScalePressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CANCELLATION BOTTOM SHEET MODAL */}
      <Modal visible={isCancelSheetOpen} transparent animationType="slide">
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsCancelSheetOpen(false)} />
          <View style={[styles.bottomSheetContainer, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: BRAND_COLORS.darkText }]}>Cancel Booking</Text>
              <Pressable onPress={() => setIsCancelSheetOpen(false)}>
                <Ionicons name="close" size={24} color={BRAND_COLORS.darkText} />
              </Pressable>
            </View>

            <View style={{ padding: GRID.lg }}>
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, marginBottom: GRID.md }]}>
                Are you sure you want to cancel? If the provider has accepted or is on the way, cancellations may incur travel commission fees.
              </Text>

              {[
                'Change of plans',
                'Found another provider',
                'Provider delayed',
                'Prices are too high'
              ].map(reason => (
                <Pressable
                  key={reason}
                  style={[
                    styles.cancelReasonOption,
                    cancelReason === reason ? { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent } : { borderColor: BRAND_COLORS.divider }
                  ]}
                  onPress={() => setCancelReason(reason)}
                >
                  <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>{reason}</Text>
                  {cancelReason === reason && (
                    <Ionicons name="checkmark-circle" size={20} color={BRAND_COLORS.primary} />
                  )}
                </Pressable>
              ))}

              <ScalePressable
                disabled={isCancelling}
                style={[styles.confirmCancelBtn, { backgroundColor: BRAND_COLORS.error }]}
                onPress={handleConfirmCancellation}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[typography.bodyLarge, { color: '#FFFFFF', fontWeight: '800' }]}>
                    CONFIRM CANCELLATION & REFUND
                  </Text>
                )}
              </ScalePressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sandbox state controllers */}
      {renderDevMenu()}
    </View>
  );

  // Summary widgets
  function renderSummaryCard() {
    return (
      <View style={[styles.summaryCard, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
        <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 }]}>
          BOOKING SUMMARY STATS
        </Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={[typography.h2, { color: BRAND_COLORS.warning, fontWeight: '800' }]}>{summaryMetrics.active}</Text>
            <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>Active</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[typography.h2, { color: BRAND_COLORS.primary, fontWeight: '800' }]}>{summaryMetrics.upcoming}</Text>
            <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>Upcoming</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[typography.h2, { color: BRAND_COLORS.success, fontWeight: '800' }]}>{summaryMetrics.completed}</Text>
            <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>Completed</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[typography.h2, { color: BRAND_COLORS.error, fontWeight: '800' }]}>{summaryMetrics.cancelled}</Text>
            <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>Cancelled</Text>
          </View>
        </View>
      </View>
    );
  }

  // Fallback inline empty state
  function renderEmptyStateInline() {
    return (
      <View style={styles.inlineEmpty}>
        <Ionicons name="calendar-outline" size={48} color={BRAND_COLORS.divider} />
        <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '700', marginTop: 12 }]}>
          No bookings match this filter
        </Text>
        <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 4, textAlign: 'center' }]}>
          Adjust chips filter or clear search terms to see list.
        </Text>
      </View>
    );
  }

  // Developer states switcher
  function renderDevMenu() {
    return (
      <View style={styles.devMenu}>
        <Pressable onPress={() => setIsDevMenuOpen(!isDevMenuOpen)} style={styles.devMenuHeader}>
          <Text style={[typography.bodySmall, { color: BRAND_COLORS.secondaryText, fontWeight: '800' }]}>
            🛠️ Dev Bookings Sandbox ({devState.toUpperCase()})
          </Text>
          <Ionicons name={isDevMenuOpen ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND_COLORS.secondaryText} />
        </Pressable>
        {isDevMenuOpen && (
          <View style={styles.devMenuButtons}>
            {[
              { id: 'normal', label: 'Bookings List' },
              { id: 'empty', label: 'Empty State View' },
              { id: 'no-internet', label: 'No Internet View' },
              { id: 'loading', label: 'Shimmers' }
            ].map(stateItem => (
              <Pressable
                key={stateItem.id}
                style={[
                  styles.devChip,
                  {
                    backgroundColor: devState === stateItem.id ? BRAND_COLORS.accent : '#F1F5F9',
                    borderColor: devState === stateItem.id ? BRAND_COLORS.accent : BRAND_COLORS.divider,
                  }
                ]}
                onPress={() => {
                  setDevState(stateItem.id as any);
                  setIsDevMenuOpen(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                  {stateItem.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  // Global Empty State
  function renderEmptyState(icon: string, title: string, desc: string, btnText: string, onBtnPress: () => void) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: BRAND_COLORS.background }]}>
        <View style={styles.emptyContent}>
          <View style={[styles.emptyIconCircle, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
            <Ionicons name={icon as any} size={48} color={BRAND_COLORS.accent} />
          </View>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, marginTop: GRID.xl, fontWeight: '800' }]}>
            {title}
          </Text>
          <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, marginTop: GRID.sm, textAlign: 'center', paddingHorizontal: 24, lineHeight: 22 }]}>
            {desc}
          </Text>
          
          <ScalePressable
            style={[styles.emptyActionBtn, { backgroundColor: BRAND_COLORS.accent }]}
            onPress={onBtnPress}
          >
            <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
              {btnText}
            </Text>
          </ScalePressable>
        </View>
        {renderDevMenu()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    marginBottom: GRID.md,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.divider,
    marginHorizontal: 24,
    paddingHorizontal: GRID.md,
    backgroundColor: '#F1F5F9',
    marginBottom: GRID.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filtersContainer: {
    height: 38,
    marginBottom: GRID.lg,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  summaryCard: {
    borderRadius: GRID.radiusCard,
    padding: GRID.lg,
    marginBottom: GRID.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  bookingCard: {
    borderRadius: GRID.radiusCard,
    borderWidth: 1.5,
    padding: GRID.md,
    marginBottom: GRID.md,
    backgroundColor: '#FFFFFF',
  },
  emergencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: GRID.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proPhoto: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  progressRow: {
    marginVertical: GRID.md,
  },
  progressTrackContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressTrackFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.divider,
    paddingTop: GRID.md,
    marginTop: GRID.sm,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBlock: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: GRID.sm,
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
  },
  ratingPanel: {
    padding: GRID.md,
    borderRadius: 12,
    marginVertical: GRID.sm,
    alignItems: 'center',
  },
  refundCard: {
    padding: GRID.md,
    borderRadius: 12,
    marginVertical: GRID.sm,
  },
  inlineEmpty: {
    alignItems: 'center',
    paddingVertical: GRID.xxl,
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GRID.lg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.divider,
  },
  dateSelectBtn: {
    flex: 1,
    padding: GRID.md,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  timeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: GRID.lg,
  },
  timeSlotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  confirmRescheduleBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID.md,
    marginBottom: GRID.xl,
  },
  cancelReasonOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: GRID.md,
    marginBottom: GRID.sm,
  },
  confirmCancelBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID.md,
    marginBottom: GRID.xl,
  },
  emergencyBanner: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 80,
    left: 24,
    right: 24,
    backgroundColor: BRAND_COLORS.error,
    padding: GRID.md,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
  },
  devMenu: {
    marginHorizontal: 24,
    marginTop: GRID.xl,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: BRAND_COLORS.divider,
    borderRadius: 12,
    overflow: 'hidden',
  },
  devMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GRID.sm,
    backgroundColor: '#FFFFFF',
  },
  devMenuButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: GRID.sm,
    backgroundColor: '#F8F8F6',
  },
  devChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: GRID.xl,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActionBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID.xl,
  },
});
