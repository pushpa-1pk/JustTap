import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  FlatList, 
  TextInput, 
  Modal, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Linking,
  RefreshControl,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import Shimmer from '@/components/common/Shimmer';
import SvgIcon from '@/components/common/SvgIcon';
import { uploadToCloudinary } from '@/utils/cloudinary';

// API queries & mutations
import { 
  useGetProviderPendingBookingsQuery, 
  useGetProviderActiveBookingsQuery, 
  useGetProviderBookingHistoryQuery,
  useAcceptBookingMutation,
  useAdvanceBookingStatusMutation,
  useVerifyBookingHandshakeMutation,
  useCancelBookingMutation
} from '@/redux/api/bookingApi';
import { useRejectBookingRequestMutation } from '@/redux/api/matchingApi';
import { useGetServicesQuery } from '@/redux/api/serviceApi';

type TabType = 'All' | 'New' | 'Upcoming' | 'Active' | 'Completed' | 'Cancelled' | 'Expired';

export default function JobsWorkspaceScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  // Queries
  const { 
    data: pendingRes, 
    isLoading: isPendingLoading, 
    isFetching: isPendingFetching, 
    refetch: refetchPending,
    error: pendingError 
  } = useGetProviderPendingBookingsQuery(undefined, { pollingInterval: 4000 });

  const { 
    data: activeRes, 
    isLoading: isActiveLoading, 
    isFetching: isActiveFetching, 
    refetch: refetchActive,
    error: activeError 
  } = useGetProviderActiveBookingsQuery(undefined, { pollingInterval: 4000 });

  const { 
    data: historyRes, 
    isLoading: isHistoryLoading, 
    isFetching: isHistoryFetching, 
    refetch: refetchHistory,
    error: historyError 
  } = useGetProviderBookingHistoryQuery();

  const { data: servicesRes } = useGetServicesQuery();

  // Mutations
  const [acceptBooking, { isLoading: isAccepting }] = useAcceptBookingMutation();
  const [rejectRequest] = useRejectBookingRequestMutation();
  const [advanceBooking, { isLoading: isAdvancing }] = useAdvanceBookingStatusMutation();
  const [verifyHandshake, { isLoading: isVerifying }] = useVerifyBookingHandshakeMutation();
  const [cancelBooking] = useCancelBookingMutation();

  const isInitialLoading = isPendingLoading || isActiveLoading || isHistoryLoading;
  const isBackgroundFetching = isPendingFetching || isActiveFetching || isHistoryFetching;

  // Search & Tab Filters
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debouncing search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Bottom Filter Sheet State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterService, setFilterService] = useState<string>('All');
  const [filterEarnings, setFilterEarnings] = useState<string>('All');
  const [filterPayment, setFilterPayment] = useState<string>('All');
  const [filterSort, setFilterSort] = useState<string>('Newest');

  // Manual Refresh
  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchPending(), refetchActive(), refetchHistory()]);
  };

  // Payout parsing helper
  const getPayout = (booking: any) => booking.priceSnapshot?.finalAmount ?? 399;

  // Hydrate booking list with service names from general catalog if missing
  const servicesList = servicesRes?.data || [];
  const hydrateBookings = (list: any[]) => {
    return (list || []).map(b => {
      if (b.serviceDetails?.name) return b;
      const match = servicesList.find((s: any) => s._id === b.serviceId);
      return {
        ...b,
        serviceDetails: {
          name: match ? match.name : 'AC Service & Repair'
        }
      };
    });
  };

  const pendingRequests = useMemo(() => hydrateBookings(pendingRes?.data || []), [pendingRes, servicesList]);
  const activeBookings = useMemo(() => hydrateBookings(activeRes?.data || []), [activeRes, servicesList]);
  const historyBookings = useMemo(() => hydrateBookings(historyRes?.data || []), [historyRes, servicesList]);

  // Dynamic counts for Job Summary Banner
  const newCount = pendingRequests.length;
  const upcomingCount = activeBookings.filter(b => b.status === 'PROVIDER_ACCEPTED').length;
  const activeCount = activeBookings.filter(b => ['ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED'].includes(b.status)).length;
  const completedCount = historyBookings.filter(b => b.status === 'COMPLETED' || b.status === 'SERVICE_COMPLETED').length;

  // Process filters, sorting, and search matching
  const processedJobs = useMemo(() => {
    let list: any[] = [];

    // 1. Tab partitioning
    switch (activeTab) {
      case 'All':
        list = [...pendingRequests, ...activeBookings, ...historyBookings];
        break;
      case 'New':
        list = [...pendingRequests];
        break;
      case 'Upcoming':
        list = activeBookings.filter(b => b.status === 'PROVIDER_ACCEPTED');
        break;
      case 'Active':
        list = activeBookings.filter(b => ['ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED'].includes(b.status));
        break;
      case 'Completed':
        list = historyBookings.filter(b => b.status === 'COMPLETED' || b.status === 'SERVICE_COMPLETED');
        break;
      case 'Cancelled':
        list = historyBookings.filter(b => b.status === 'CANCELLED');
        break;
      case 'Expired':
        list = historyBookings.filter(b => b.status === 'FAILED');
        break;
    }

    // 2. Debounced search query
    if (debouncedQuery.trim() !== '') {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(b => 
        (b._id && b._id.toLowerCase().includes(q)) ||
        (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q)) ||
        (b.serviceDetails?.name && b.serviceDetails.name.toLowerCase().includes(q)) ||
        (b.customerSnapshot?.fullName && b.customerSnapshot.fullName.toLowerCase().includes(q))
      );
    }

    // 3. Service filter
    if (filterService !== 'All') {
      list = list.filter(b => b.serviceDetails?.name === filterService);
    }

    // 4. Earnings filter
    if (filterEarnings !== 'All') {
      list = list.filter(b => {
        const pay = getPayout(b);
        if (filterEarnings === 'Under ₹500') return pay < 500;
        if (filterEarnings === '₹500 - ₹1000') return pay >= 500 && pay <= 1000;
        if (filterEarnings === 'Over ₹1000') return pay > 1000;
        return true;
      });
    }

    // 5. Payment Status filter
    if (filterPayment !== 'All') {
      list = list.filter(b => b.paymentStatus === filterPayment);
    }

    // 6. Sorting
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.scheduledStartTime).getTime();
      const timeB = new Date(b.createdAt || b.scheduledStartTime).getTime();
      const payA = getPayout(a);
      const payB = getPayout(b);

      if (filterSort === 'Newest') return timeB - timeA;
      if (filterSort === 'Oldest') return timeA - timeB;
      if (filterSort === 'Highest Earnings') return payB - payA;
      if (filterSort === 'Nearest') return 1; // Coordinates based sort requires current GPS coordinates.
      return 0;
    });

    return list;
  }, [
    activeTab, 
    pendingRequests, 
    activeBookings, 
    historyBookings, 
    debouncedQuery, 
    filterService, 
    filterEarnings, 
    filterPayment, 
    filterSort
  ]);

  // Actions
  const handleAccept = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const response = await acceptBooking(id).unwrap();
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        refetchPending();
        refetchActive();
        setActiveTab('Active');
      }
    } catch (err: any) {
      console.error('Accept job failed:', err);
      Alert.alert('Accept Conflict', err.data?.message || 'Job was accepted by another provider first.');
    }
  };

  const handleDecline = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await rejectRequest({ invitationId: id }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetchPending();
    } catch (err) {
      console.error('Decline request failed:', err);
      Alert.alert('Decline Failed', 'Unable to decline request.');
    }
  };

  const handleCancelJob = (id: string) => {
    Alert.prompt(
      'Cancel Booking',
      'Please state the reason for canceling this booking:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Cancel', 
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Error', 'Reason code is required to cancel a booking.');
              return;
            }
            try {
              await cancelBooking({ id, reasonCode: 'PROVIDER_CANCEL', customExplanation: reason }).unwrap();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetchActive();
              refetchHistory();
            } catch (err) {
              console.error('Cancellation failed:', err);
              Alert.alert('Cancellation Failed', 'Failed to cancel the booking.');
            }
          }
        }
      ]
    );
  };

  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    [...pendingRequests, ...activeBookings, ...historyBookings].forEach(b => {
      if (b.serviceDetails?.name) set.add(b.serviceDetails.name);
    });
    return Array.from(set);
  }, [pendingRequests, activeBookings, historyBookings]);

  // Loading Skeleton State
  if (isInitialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <View style={styles.header}>
          <Shimmer width={100} height={24} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Shimmer width={24} height={24} borderRadius={12} />
            <Shimmer width={24} height={24} borderRadius={12} />
          </View>
        </View>
        <View style={styles.skeletonSummary}>
          <Shimmer width="22%" height={56} borderRadius={12} />
          <Shimmer width="22%" height={56} borderRadius={12} />
          <Shimmer width="22%" height={56} borderRadius={12} />
          <Shimmer width="22%" height={56} borderRadius={12} />
        </View>
        <View style={styles.skeletonTabs}>
          <Shimmer width={60} height={32} borderRadius={8} />
          <Shimmer width={60} height={32} borderRadius={8} />
          <Shimmer width={60} height={32} borderRadius={8} />
          <Shimmer width={60} height={32} borderRadius={8} />
        </View>
        <ScrollView style={{ padding: 20 }}>
          <Shimmer width="100%" height={160} borderRadius={16} style={{ marginBottom: 16 }} />
          <Shimmer width="100%" height={160} borderRadius={16} style={{ marginBottom: 16 }} />
        </ScrollView>
      </View>
    );
  }

  // Network/Server Error Gate
  const hasError = !!(pendingError || activeError || historyError);
  const hasNoData = pendingRequests.length === 0 && activeBookings.length === 0 && historyBookings.length === 0;
  if (hasError && hasNoData) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons name="wifi-outline" size={48} color="#EF4444" />
        <Text style={[typography.h3, { color: '#0F172A', marginTop: 16 }]}>
          Unable to load jobs
        </Text>
        <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 }]}>
          Please check your connection and retry.
        </Text>
        <Pressable onPress={handleRefresh} style={[styles.retryBtn, { backgroundColor: '#16A34A' }]}>
          <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {/* Network Offline Safe Banner */}
      {hasError && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
          <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '700', marginLeft: 6 }]}>
            You're Offline. Showing previously loaded cached jobs.
          </Text>
        </View>
      )}

      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        {searchOpen ? (
          <View style={styles.searchInputRow}>
            <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 6 }} />
            <TextInput
              style={[styles.searchInput, typography.bodyMedium]}
              placeholder="Search by ID, Customer, Service..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <Pressable onPress={() => { setSearchQuery(''); setSearchOpen(false); }}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800' }]}>Jobs</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={() => setSearchOpen(true)} style={styles.actionBtn}>
                <Ionicons name="search-outline" size={22} color="#0F172A" />
              </Pressable>
              <Pressable onPress={() => setFilterModalVisible(true)} style={styles.actionBtn}>
                <Ionicons name="options-outline" size={22} color="#0F172A" />
                {(filterService !== 'All' || filterEarnings !== 'All' || filterPayment !== 'All') && (
                  <View style={styles.filterDot} />
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* 2. JOB SUMMARY Counts row (tappable) */}
      <View style={styles.summaryRow}>
        <Pressable onPress={() => setActiveTab('New')} style={[styles.summaryTile, activeTab === 'New' && styles.activeTile]}>
          <Text style={[typography.caption, { color: '#64748B', fontWeight: '600' }]}>New</Text>
          <Text style={[typography.h2, { color: '#EF4444', fontWeight: '800', marginTop: 2 }]}>{newCount}</Text>
        </Pressable>

        <Pressable onPress={() => setActiveTab('Upcoming')} style={[styles.summaryTile, activeTab === 'Upcoming' && styles.activeTile]}>
          <Text style={[typography.caption, { color: '#64748B', fontWeight: '600' }]}>Upcoming</Text>
          <Text style={[typography.h2, { color: '#3B82F6', fontWeight: '800', marginTop: 2 }]}>{upcomingCount}</Text>
        </Pressable>

        <Pressable onPress={() => setActiveTab('Active')} style={[styles.summaryTile, activeTab === 'Active' && styles.activeTile]}>
          <Text style={[typography.caption, { color: '#64748B', fontWeight: '600' }]}>Active</Text>
          <Text style={[typography.h2, { color: '#16A34A', fontWeight: '800', marginTop: 2 }]}>{activeCount}</Text>
        </Pressable>

        <Pressable onPress={() => setActiveTab('Completed')} style={[styles.summaryTile, activeTab === 'Completed' && styles.activeTile]}>
          <Text style={[typography.caption, { color: '#64748B', fontWeight: '600' }]}>Done</Text>
          <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800', marginTop: 2 }]}>{completedCount}</Text>
        </Pressable>
      </View>

      {/* 3. HORIZONTAL TABS */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {(['All', 'New', 'Upcoming', 'Active', 'Completed', 'Cancelled', 'Expired'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && { borderBottomColor: '#16A34A' }]}
            >
              <Text style={[
                typography.bodyMedium, 
                { 
                  color: activeTab === tab ? '#16A34A' : '#64748B', 
                  fontWeight: activeTab === tab ? '800' : '500' 
                }
              ]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 4. JOBS LIST */}
      <FlatList
        data={processedJobs}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isBackgroundFetching}
            onRefresh={handleRefresh}
            colors={['#16A34A']}
            tintColor="#16A34A"
          />
        }
        renderItem={({ item }) => {
          if (item.status === 'PENDING_PROVIDER_RESPONSE') {
            return (
              <NewJobRequestCard
                booking={item}
                onAccept={handleAccept}
                onDecline={handleDecline}
                isAccepting={isAccepting}
              />
            );
          }
          if (['ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED'].includes(item.status)) {
            return (
              <ActiveJobCard
                booking={item}
                onAdvance={advanceBooking}
                isAdvancing={isAdvancing}
                onVerify={verifyHandshake}
                isVerifying={isVerifying}
                onCancel={() => handleCancelJob(item._id)}
                refetchActive={refetchActive}
                refetchHistory={refetchHistory}
              />
            );
          }
          if (item.status === 'PROVIDER_ACCEPTED') {
            return (
              <UpcomingJobCard
                booking={item}
                onStartTravel={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  advanceBooking({ id: item._id, nextStatus: 'ON_THE_WAY' }).unwrap().then(() => {
                    refetchActive();
                    setActiveTab('Active');
                  });
                }}
                isStarting={isAdvancing}
                onCancel={() => handleCancelJob(item._id)}
                onViewDetails={() => router.push({ pathname: '/(provider)/job-details', params: { bookingId: item._id } })}
              />
            );
          }
          if (item.status === 'COMPLETED' || item.status === 'SERVICE_COMPLETED') {
            return (
              <CompletedJobCard
                booking={item}
                onViewDetails={() => router.push({ pathname: '/(provider)/job-details', params: { bookingId: item._id } })}
              />
            );
          }
          if (item.status === 'CANCELLED') {
            return <CancelledJobCard booking={item} />;
          }
          return <ExpiredJobCard booking={item} />;
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={44} color="#94A3B8" />
            <Text style={[typography.bodyLarge, { color: '#64748B', fontWeight: '700', marginTop: 12 }]}>
              {activeTab === 'New' ? 'No new job requests' :
               activeTab === 'Upcoming' ? 'No upcoming jobs' :
               activeTab === 'Active' ? 'No active jobs' :
               activeTab === 'Completed' ? 'No completed jobs yet' :
               activeTab === 'Cancelled' ? 'No cancelled jobs' :
               'No jobs found'}
            </Text>
            <Text style={[typography.caption, { color: '#94A3B8', marginTop: 4, textAlign: 'center' }]}>
              Pull down to refresh and sync with Dispatcher.
            </Text>
          </View>
        }
      />

      {/* 5. FILTER BOTTOM SHEET MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: '#0F172A', fontWeight: '800' }]}>Filters & Sorting</Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Sort Section */}
              <Text style={[typography.bodyMedium, styles.filterTitle]}>SORT BY</Text>
              <View style={styles.optionsRow}>
                {['Newest', 'Oldest', 'Highest Earnings'].map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setFilterSort(s)}
                    style={[styles.optionPill, filterSort === s && styles.optionPillActive]}
                  >
                    <Text style={[typography.caption, { color: filterSort === s ? '#FFFFFF' : '#64748B', fontWeight: '700' }]}>{s}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Service Type Filter */}
              <Text style={[typography.bodyMedium, styles.filterTitle]}>SERVICE CATEGORY</Text>
              <View style={styles.optionsRow}>
                <Pressable
                  onPress={() => setFilterService('All')}
                  style={[styles.optionPill, filterService === 'All' && styles.optionPillActive]}
                >
                  <Text style={[typography.caption, { color: filterService === 'All' ? '#FFFFFF' : '#64748B', fontWeight: '700' }]}>All Services</Text>
                </Pressable>
                {uniqueServices.map((srv) => (
                  <Pressable
                    key={srv}
                    onPress={() => setFilterService(srv)}
                    style={[styles.optionPill, filterService === srv && styles.optionPillActive]}
                  >
                    <Text style={[typography.caption, { color: filterService === srv ? '#FFFFFF' : '#64748B', fontWeight: '700' }]}>{srv}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Earnings Filter */}
              <Text style={[typography.bodyMedium, styles.filterTitle]}>ESTIMATED PAYOUT</Text>
              <View style={styles.optionsRow}>
                {['All', 'Under ₹500', '₹500 - ₹1000', 'Over ₹1000'].map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setFilterEarnings(e)}
                    style={[styles.optionPill, filterEarnings === e && styles.optionPillActive]}
                  >
                    <Text style={[typography.caption, { color: filterEarnings === e ? '#FFFFFF' : '#64748B', fontWeight: '700' }]}>{e}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Payment Status Filter */}
              <Text style={[typography.bodyMedium, styles.filterTitle]}>PAYMENT STATUS</Text>
              <View style={styles.optionsRow}>
                {['All', 'PENDING', 'PAID', 'FAILED'].map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setFilterPayment(p)}
                    style={[styles.optionPill, filterPayment === p && styles.optionPillActive]}
                  >
                    <Text style={[typography.caption, { color: filterPayment === p ? '#FFFFFF' : '#64748B', fontWeight: '700' }]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setFilterService('All');
                  setFilterEarnings('All');
                  setFilterPayment('All');
                  setFilterSort('Newest');
                }}
                style={[styles.modalBtn, { borderWidth: 1.5, borderColor: '#E5E7EB' }]}
              >
                <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700' }]}>Reset All</Text>
              </Pressable>

              <Pressable
                onPress={() => setFilterModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: '#16A34A' }]}
              >
                <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// 1. NEW JOB REQUEST CARD
// ==========================================
function NewJobRequestCard({ booking, onAccept, onDecline, isAccepting }: { booking: any; onAccept: (id: string) => void; onDecline: (id: string) => void; isAccepting: boolean }) {
  const { typography } = useTheme();

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  useEffect(() => {
    const calculateDiff = () => {
      // Assuming request expires 10 minutes from creation
      const diff = Math.max(0, Math.floor((new Date(booking.createdAt).getTime() + 10 * 60 * 1000 - Date.now()) / 1000));
      setTimeRemaining(diff);
    };

    calculateDiff();
    const interval = setInterval(calculateDiff, 1000);
    return () => clearInterval(interval);
  }, [booking.createdAt]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const payout = booking.priceSnapshot?.finalAmount ?? 499;

  return (
    <View style={[styles.card, { borderColor: '#F59E0B', backgroundColor: '#FFF9F0' }]}>
      <View style={styles.cardTagRow}>
        <View style={[styles.tagBadge, { backgroundColor: '#F59E0B15' }]}>
          <Text style={[typography.caption, { color: '#D97706', fontWeight: '800' }]}>🔔 NEW REQUEST</Text>
        </View>
        <Text style={[typography.caption, { color: '#EF4444', fontWeight: '700' }]}>
          Expires in {formatTime(timeRemaining)}
        </Text>
      </View>

      <Text style={[typography.h3, { color: '#0F172A', fontWeight: '800', marginTop: 10 }]}>
        {booking.serviceDetails?.name}
      </Text>
      
      <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 4 }]}>
        Client: {booking.customerSnapshot?.fullName || 'Anonymous'}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location" size={14} color="#64748B" />
          <Text style={[typography.caption, { color: '#64748B', marginLeft: 4 }]}>1.4 km away</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time" size={14} color="#64748B" />
          <Text style={[typography.caption, { color: '#64748B', marginLeft: 4 }]}>Est arrival: 8 min</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: '#E5E7EB' }]} />

      <View style={styles.priceRow}>
        <Text style={[typography.bodyMedium, { color: '#64748B' }]}>Est. Payout:</Text>
        <Text style={[typography.h2, { color: '#16A34A', fontWeight: '900' }]}>₹{payout}</Text>
      </View>

      <View style={styles.btnRow}>
        <Pressable
          onPress={() => onDecline(booking._id)}
          disabled={isAccepting}
          style={[styles.cardBtn, { borderColor: '#E5E7EB', borderWidth: 1.5 }]}
        >
          <Text style={[typography.bodyMedium, { color: '#EF4444', fontWeight: '700' }]}>Decline</Text>
        </Pressable>

        <Pressable
          onPress={() => onAccept(booking._id)}
          disabled={isAccepting}
          style={[styles.cardBtn, { backgroundColor: '#16A34A' }]}
        >
          {isAccepting ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
            <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Accept Request</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ==========================================
// 2. ACTIVE JOB CARD & LIFECYCLE STEPPER
// ==========================================
interface ActiveJobCardProps {
  booking: any;
  onAdvance: any;
  isAdvancing: boolean;
  onVerify: any;
  isVerifying: boolean;
  onCancel: () => void;
  refetchActive: () => void;
  refetchHistory: () => void;
}

function ActiveJobCard({ 
  booking, 
  onAdvance, 
  isAdvancing, 
  onVerify, 
  isVerifying, 
  onCancel,
  refetchActive,
  refetchHistory 
}: ActiveJobCardProps) {
  const { typography } = useTheme();
  const router = useRouter();

  const [otpCode, setOtpCode] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Stepper highlights
  const getStepIndex = (status: string) => {
    if (status === 'ON_THE_WAY') return 1;
    if (status === 'ARRIVED') return 2;
    if (status === 'SERVICE_STARTED') return 3;
    return 0; // ACCEPTED
  };

  const currentStep = getStepIndex(booking.status);

  // Map directions launch
  const handleNavigate = () => {
    const addr = booking.customerAddressSnapshot;
    const url = `https://www.google.com/maps/search/?api=1&query=${addr.addressLine1}, ${addr.city}`;
    Linking.openURL(url);
  };

  // Trigger masking call
  const handleCall = () => {
    const phone = booking.customerSnapshot?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Phone Unmapped', 'Unable to reach the customer.');
    }
  };

  // Select photo from library
  const handleAddPhotos = async (useCamera: boolean) => {
    try {
      const { status } = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permissions are needed to attach photos.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const cloud = await uploadToCloudinary(result.assets[0].uri);
        setUploadedPhotos(prev => [...prev, cloud.secure_url]);
        setUploading(false);
      }
    } catch (err) {
      setUploading(false);
      Alert.alert('Upload Failed', 'Unable to upload photo to Cloudinary.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Perform OTP Verifications
  const handleVerifyOtp = async (purpose: 'START_SERVICE' | 'COMPLETE_SERVICE') => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('OTP Incomplete', 'Please type the 6-digit OTP code sent to the client.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const response = await onVerify({
        id: booking._id,
        rawOtp: otpCode,
        purpose,
        completionPhotos: purpose === 'COMPLETE_SERVICE' ? uploadedPhotos : undefined
      }).unwrap();

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOtpCode('');
        setUploadedPhotos([]);
        refetchActive();
        refetchHistory();
      }
    } catch (err: any) {
      console.error('OTP Verification failed:', err);
      Alert.alert('Verification Failed', err.data?.message || 'The OTP entered is incorrect.');
    }
  };

  const handleStateAdvance = async (next: 'ON_THE_WAY' | 'ARRIVED') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onAdvance({ id: booking._id, nextStatus: next }).unwrap();
      refetchActive();
    } catch (err) {
      Alert.alert('Update Failed', 'Failed to advance job status.');
    }
  };

  return (
    <View style={[styles.card, { borderColor: '#16A34A', borderWidth: 2 }]}>
      <View style={styles.cardTagRow}>
        <View style={[styles.tagBadge, { backgroundColor: '#16A34A15' }]}>
          <Text style={[typography.caption, { color: '#15803D', fontWeight: '800' }]}>🚗 ACTIVE JOB</Text>
        </View>
        <Text style={[typography.caption, { color: '#64748B', fontWeight: '700' }]}>
          #{booking.bookingNumber || booking._id.slice(-6).toUpperCase()}
        </Text>
      </View>

      <Text style={[typography.h3, { color: '#0F172A', fontWeight: '800', marginTop: 10 }]}>
        {booking.serviceDetails?.name}
      </Text>
      <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 2 }]}>
        Client: {booking.customerSnapshot?.fullName || 'Anonymous'}
      </Text>

      {/* Dynamic Stepper Bar */}
      <View style={styles.stepperContainer}>
        {['Accepted', 'En-Route', 'Arrived', 'Serving'].map((step, idx) => (
          <View key={step} style={styles.stepItem}>
            <View style={[
              styles.stepDot, 
              { backgroundColor: currentStep >= idx ? '#16A34A' : '#E5E7EB' }
            ]}>
              {currentStep >= idx ? <Ionicons name="checkmark" size={10} color="#FFFFFF" /> : null}
            </View>
            <Text style={[
              typography.caption, 
              { color: currentStep >= idx ? '#16A34A' : '#94A3B8', fontWeight: currentStep >= idx ? '700' : '400', marginTop: 4 }
            ]}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      {/* Location address summary */}
      <Text style={[typography.caption, { color: '#64748B', marginTop: 12 }]}>
        📍 Address: {booking.customerAddressSnapshot?.addressLine1}, {booking.customerAddressSnapshot?.city}
      </Text>

      <View style={[styles.divider, { backgroundColor: '#E5E7EB' }]} />

      {/* Conditional Stepper Actions */}
      {booking.status === 'PROVIDER_ACCEPTED' && (
        <View style={styles.stepperActionPanel}>
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '600', marginBottom: 10 }]}>
            Upcoming appointment. Start traveling when ready:
          </Text>
          <Pressable
            onPress={() => handleStateAdvance('ON_THE_WAY')}
            disabled={isAdvancing}
            style={[styles.actionBtnPrimary, { backgroundColor: '#16A34A' }]}
          >
            {isAdvancing ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Start Traveling</Text>
            )}
          </Pressable>
        </View>
      )}

      {booking.status === 'ON_THE_WAY' && (
        <View style={styles.stepperActionPanel}>
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '600', marginBottom: 10 }]}>
            En-route to client. Tap when you arrive at their location:
          </Text>
          <Pressable
            onPress={() => handleStateAdvance('ARRIVED')}
            disabled={isAdvancing}
            style={[styles.actionBtnPrimary, { backgroundColor: '#16A34A' }]}
          >
            {isAdvancing ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>I've Arrived</Text>
            )}
          </Pressable>
        </View>
      )}

      {booking.status === 'ARRIVED' && (
        <View style={styles.stepperActionPanel}>
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '600', marginBottom: 8 }]}>
            Arrived. Ask client for the <Text style={{ fontWeight: '800', color: '#16A34A' }}>Start Service OTP</Text>:
          </Text>
          <TextInput
            style={[styles.otpTextInput, typography.h3]}
            placeholder="6-digit Start OTP"
            maxLength={6}
            keyboardType="number-pad"
            value={otpCode}
            onChangeText={setOtpCode}
          />
          <Pressable
            onPress={() => handleVerifyOtp('START_SERVICE')}
            disabled={isVerifying}
            style={[styles.actionBtnPrimary, { backgroundColor: '#16A34A', marginTop: 10 }]}
          >
            {isVerifying ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Verify & Start Service</Text>
            )}
          </Pressable>
        </View>
      )}

      {booking.status === 'SERVICE_STARTED' && (
        <View style={styles.stepperActionPanel}>
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700', marginBottom: 8 }]}>
            Service is in progress. Complete task checklist:
          </Text>
          
          {/* Photo upload boundary */}
          <Text style={[typography.caption, { color: '#64748B', fontWeight: '700', marginBottom: 6 }]}>
            📸 UPLOAD COMPLETION PHOTOS ({uploadedPhotos.length} attached)
          </Text>
          
          <View style={styles.photoUploadRow}>
            <Pressable onPress={() => handleAddPhotos(true)} style={styles.photoPickBtn}>
              <Ionicons name="camera" size={20} color="#64748B" />
              <Text style={[typography.caption, { color: '#64748B', marginTop: 2 }]}>Camera</Text>
            </Pressable>
            <Pressable onPress={() => handleAddPhotos(false)} style={styles.photoPickBtn}>
              <Ionicons name="images" size={20} color="#64748B" />
              <Text style={[typography.caption, { color: '#64748B', marginTop: 2 }]}>Gallery</Text>
            </Pressable>

            {/* Photo Previews */}
            <ScrollView horizontal style={styles.previewsScroll}>
              {uploadedPhotos.map((url, i) => (
                <View key={url} style={styles.previewContainer}>
                  <Image source={{ uri: url }} style={styles.previewImg} />
                  <Pressable onPress={() => handleRemovePhoto(i)} style={styles.previewDeleteBtn}>
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
              {uploading && (
                <View style={[styles.photoPickBtn, { borderStyle: 'solid' }]}>
                  <ActivityIndicator size="small" color="#16A34A" />
                  <Text style={[typography.caption, { color: '#16A34A', marginTop: 4 }]}>Uploading...</Text>
                </View>
              )}
            </ScrollView>
          </View>

          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '600', marginTop: 12, marginBottom: 8 }]}>
            Enter client's <Text style={{ fontWeight: '800', color: '#16A34A' }}>Complete Service OTP</Text>:
          </Text>
          <TextInput
            style={[styles.otpTextInput, typography.h3]}
            placeholder="6-digit Complete OTP"
            maxLength={6}
            keyboardType="number-pad"
            value={otpCode}
            onChangeText={setOtpCode}
          />
          
          <Pressable
            onPress={() => handleVerifyOtp('COMPLETE_SERVICE')}
            disabled={isVerifying || uploading}
            style={[styles.actionBtnPrimary, { backgroundColor: '#16A34A', marginTop: 10 }]}
          >
            {isVerifying ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Verify & Finalize Job</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Hot Action Panel buttons */}
      <View style={[styles.activeActionsRow, { marginTop: 14 }]}>
        <Pressable onPress={handleNavigate} style={[styles.actionBtnIcon, { borderColor: '#E5E7EB', borderWidth: 1 }]}>
          <Ionicons name="map" size={18} color="#0F172A" />
          <Text style={[typography.caption, { color: '#0F172A', fontWeight: '700', marginLeft: 6 }]}>Navigate</Text>
        </Pressable>

        <Pressable onPress={handleCall} style={[styles.actionBtnIcon, { borderColor: '#E5E7EB', borderWidth: 1 }]}>
          <Ionicons name="call" size={18} color="#0F172A" />
          <Text style={[typography.caption, { color: '#0F172A', fontWeight: '700', marginLeft: 6 }]}>Call</Text>
        </Pressable>

        <Pressable 
          onPress={() => router.push({ pathname: '/(provider)/(tabs)/messages', params: { bookingId: booking._id } })}
          style={[styles.actionBtnIcon, { borderColor: '#E5E7EB', borderWidth: 1 }]}
        >
          <Ionicons name="chatbubble" size={18} color="#0F172A" />
          <Text style={[typography.caption, { color: '#0F172A', fontWeight: '700', marginLeft: 6 }]}>Chat</Text>
        </Pressable>
      </View>

      {/* Critical Cancel Job Button */}
      {['PROVIDER_ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(booking.status) && (
        <Pressable onPress={onCancel} style={styles.cancelLinkBtn}>
          <Text style={[typography.caption, { color: '#EF4444', fontWeight: '700' }]}>Cancel This Booking</Text>
        </Pressable>
      )}
    </View>
  );
}

// ==========================================
// 3. UPCOMING JOB CARD
// ==========================================
function UpcomingJobCard({ booking, onStartTravel, isStarting, onCancel, onViewDetails }: { booking: any; onStartTravel: () => void; isStarting: boolean; onCancel: () => void; onViewDetails: () => void }) {
  const { typography } = useTheme();
  const start = new Date(booking.scheduledStartTime);
  const dateStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  const timeStr = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const payout = booking.priceSnapshot?.finalAmount ?? 399;

  return (
    <View style={[styles.card, { borderColor: '#E5E7EB' }]}>
      <View style={styles.cardTagRow}>
        <View style={[styles.tagBadge, { backgroundColor: '#F8FAFC' }]}>
          <Text style={[typography.caption, { color: '#64748B', fontWeight: '800' }]}>📅 UPCOMING JOB</Text>
        </View>
        <Text style={[typography.caption, { color: '#3B82F6', fontWeight: '800' }]}>
          {dateStr} • {timeStr}
        </Text>
      </View>

      <Text style={[typography.h3, { color: '#0F172A', fontWeight: '800', marginTop: 10 }]}>
        {booking.serviceDetails?.name}
      </Text>
      
      <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 4 }]}>
        Client: {booking.customerSnapshot?.fullName || 'Anonymous'}
      </Text>

      <View style={styles.priceRow}>
        <Text style={[typography.bodyMedium, { color: '#64748B' }]}>Payout:</Text>
        <Text style={[typography.h2, { color: '#16A34A', fontWeight: '900' }]}>₹{payout}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: '#E5E7EB' }]} />

      <View style={styles.btnRow}>
        <Pressable
          onPress={onViewDetails}
          style={[styles.cardBtn, { borderColor: '#E5E7EB', borderWidth: 1.5 }]}
        >
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700' }]}>Details</Text>
        </Pressable>

        <Pressable
          onPress={onStartTravel}
          disabled={isStarting}
          style={[styles.cardBtn, { backgroundColor: '#16A34A' }]}
        >
          {isStarting ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
            <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Start Traveling</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={onCancel} style={styles.cancelLinkBtn}>
        <Text style={[typography.caption, { color: '#EF4444', fontWeight: '700' }]}>Cancel Booking</Text>
      </Pressable>
    </View>
  );
}

// ==========================================
// 4. COMPLETED JOB CARD
// ==========================================
function CompletedJobCard({ booking, onViewDetails }: { booking: any; onViewDetails: () => void }) {
  const { typography } = useTheme();
  
  const start = new Date(booking.scheduledStartTime);
  const dateStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const payout = booking.priceSnapshot?.finalAmount ?? 399;

  return (
    <View style={[styles.card, { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }]}>
      <View style={styles.cardTagRow}>
        <View style={[styles.tagBadge, { backgroundColor: '#16A34A10' }]}>
          <Text style={[typography.caption, { color: '#15803D', fontWeight: '800' }]}>✓ COMPLETED</Text>
        </View>
        <Text style={[typography.caption, { color: '#94A3B8' }]}>
          {dateStr}
        </Text>
      </View>

      <Text style={[typography.h3, { color: '#0F172A', fontWeight: '800', marginTop: 10 }]}>
        {booking.serviceDetails?.name}
      </Text>
      <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 2 }]}>
        Client: {booking.customerSnapshot?.fullName || 'Anonymous'}
      </Text>

      <View style={styles.priceRow}>
        <Text style={[typography.bodyMedium, { color: '#64748B' }]}>Total Payout:</Text>
        <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800' }]}>₹{payout}</Text>
      </View>

      {/* Completion Photos indicator */}
      {booking.completionPhotos && booking.completionPhotos.length > 0 && (
        <View style={styles.photosIndicator}>
          <Ionicons name="images-outline" size={14} color="#64748B" />
          <Text style={[typography.caption, { color: '#64748B', marginLeft: 4 }]}>
            {booking.completionPhotos.length} completion photos uploaded
          </Text>
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: '#E5E7EB' }]} />

      <View style={styles.btnRow}>
        <Pressable
          onPress={onViewDetails}
          style={[styles.cardBtn, { borderColor: '#E5E7EB', borderWidth: 1.5, flex: 1 }]}
        >
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700' }]}>View Details</Text>
        </Pressable>
        <Pressable
          onPress={() => Alert.alert('Invoice Downloaded', 'Receipt file saved to your device.')}
          style={[styles.cardBtn, { backgroundColor: '#FFF9F0', borderColor: '#FBBF24', borderWidth: 1 }]}
        >
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700' }]}>Receipt</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ==========================================
// 5. CANCELLED JOB CARD
// ==========================================
function CancelledJobCard({ booking }: { booking: any }) {
  const { typography } = useTheme();
  const start = new Date(booking.scheduledStartTime);
  const dateStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <View style={[styles.card, { borderColor: '#EF444420', backgroundColor: '#FFF5F5' }]}>
      <View style={styles.cardTagRow}>
        <View style={[styles.tagBadge, { backgroundColor: '#EF444415' }]}>
          <Text style={[typography.caption, { color: '#EF4444', fontWeight: '800' }]}>✕ CANCELLED</Text>
        </View>
        <Text style={[typography.caption, { color: '#EF4444' }]}>{dateStr}</Text>
      </View>

      <Text style={[typography.h3, { color: '#0F172A', fontWeight: '800', marginTop: 10 }]}>
        {booking.serviceDetails?.name}
      </Text>
      <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 2 }]}>
        Client: {booking.customerSnapshot?.fullName || 'Anonymous'}
      </Text>

      <View style={[styles.divider, { backgroundColor: '#EF444415' }]} />

      <Text style={[typography.caption, { color: '#EF4444', fontWeight: '700' }]}>
        Reason: {booking.additionalNotes || 'Cancelled by customer / support'}
      </Text>
    </View>
  );
}

// ==========================================
// 6. EXPIRED REQUEST CARD
// ==========================================
function ExpiredJobCard({ booking }: { booking: any }) {
  const { typography } = useTheme();
  const start = new Date(booking.scheduledStartTime);
  const dateStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <View style={[styles.card, { borderColor: '#E5E7EB', backgroundColor: '#F8FAFC' }]}>
      <View style={styles.cardTagRow}>
        <View style={[styles.tagBadge, { backgroundColor: '#E2E8F0' }]}>
          <Text style={[typography.caption, { color: '#64748B', fontWeight: '800' }]}>⌛ EXPIRED</Text>
        </View>
        <Text style={[typography.caption, { color: '#64748B' }]}>{dateStr}</Text>
      </View>

      <Text style={[typography.h3, { color: '#94A3B8', fontWeight: '800', marginTop: 10 }]}>
        {booking.serviceDetails?.name}
      </Text>
      
      <View style={[styles.divider, { backgroundColor: '#E2E8F0' }]} />

      <Text style={[typography.caption, { color: '#94A3B8', fontStyle: 'italic' }]}>
        Reason: Request Timeout (provider response window expired)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    height: 60,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  searchInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 10,
    alignItems: 'center',
  },
  activeTile: {
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
  },
  tabsScroll: {
    paddingHorizontal: 16,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1.5,
  },
  cardTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperActionPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  actionBtnPrimary: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpTextInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
    color: '#0F172A',
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  photoPickBtn: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  previewsScroll: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  previewContainer: {
    position: 'relative',
    marginRight: 8,
  },
  previewImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  previewDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnIcon: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelLinkBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  photosIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  // Skeleton Layouts
  skeletonSummary: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  // Modal filter sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalScroll: {
    paddingBottom: 20,
  },
  filterTitle: {
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 12,
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  optionPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
