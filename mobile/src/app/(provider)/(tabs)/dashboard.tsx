import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { RootState } from '@/redux/store';
import Shimmer from '@/components/common/Shimmer';

// API hooks
import { 
  useGetProviderPendingBookingsQuery, 
  useGetProviderActiveBookingsQuery, 
  useGetProviderBookingHistoryQuery,
  useAcceptBookingMutation
} from '@/redux/api/bookingApi';
import { useRejectBookingRequestMutation } from '@/redux/api/matchingApi';
import { useGetNotificationsQuery } from '@/redux/api/notificationApi';
import { 
  useGetProviderProfile, 
  useToggleOnlineStatus, 
  useGetProviderReviews 
} from '@/hooks/useProviderProfile';
import { useGetServicesQuery } from '@/redux/api/serviceApi';

// Subcomponents
import DashboardHeader from '@/components/provider/DashboardHeader';
import AvailabilityCard from '@/components/provider/AvailabilityCard';
import JobPrioritySection from '@/components/provider/JobPrioritySection';
import TodaySummaryCard from '@/components/provider/TodaySummaryCard';
import TodayJobsSection from '@/components/provider/TodayJobsSection';
import EarningsSnapshot from '@/components/provider/EarningsSnapshot';
import PerformanceCard from '@/components/provider/PerformanceCard';
import ServiceAreaCard from '@/components/provider/ServiceAreaCard';
import LatestReviewCard from '@/components/provider/LatestReviewCard';
import AnnouncementCard from '@/components/provider/AnnouncementCard';

export default function ProviderDashboardScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);

  // Queries & Mutations
  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    isRefetching: isProfileRefetching, 
    refetch: refetchProfile,
    error: profileError
  } = useGetProviderProfile();

  const toggleOnlineMutation = useToggleOnlineStatus();
  
  // Real-time pending and active bookings polling (every 4 seconds)
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

  const { data: notificationsRes, refetch: refetchNotifications } = useGetNotificationsQuery();
  const { data: reviewsRes, refetch: refetchReviews } = useGetProviderReviews(profile?.userId || '');
  const { data: servicesRes } = useGetServicesQuery();

  const [acceptBooking, { isLoading: isAccepting }] = useAcceptBookingMutation();
  const [rejectRequest] = useRejectBookingRequestMutation();

  const isInitialLoading = isProfileLoading || isPendingLoading || isActiveLoading || isHistoryLoading;
  const isRefreshing = refreshing || isProfileRefetching || isPendingFetching || isActiveFetching || isHistoryFetching;

  // Manual pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      refetchProfile(),
      refetchPending(),
      refetchActive(),
      refetchHistory(),
      refetchNotifications(),
      refetchReviews()
    ]);
    setRefreshing(false);
  }, [refetchProfile, refetchPending, refetchActive, refetchHistory, refetchNotifications, refetchReviews]);

  // Actions
  const handleToggleOnline = async () => {
    const nextState = !(profile?.isOnline);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await toggleOnlineMutation.mutateAsync(nextState);
      refetchProfile();
    } catch (err) {
      console.error('Toggle availability failed:', err);
      Alert.alert('Status Error', 'Failed to update availability status.');
    }
  };

  const handleAcceptRequest = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const response = await acceptBooking(id).unwrap();
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        refetchPending();
        refetchActive();
        router.push({
          pathname: '/(provider)/job-details',
          params: { bookingId: id }
        });
      }
    } catch (err: any) {
      console.error('Accept job failed:', err);
      Alert.alert('Accept Failed', err.data?.message || 'Failed to accept booking request.');
    }
  };

  const handleDeclineRequest = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await rejectRequest({ invitationId: id }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetchPending();
    } catch (err) {
      console.error('Decline request failed:', err);
      Alert.alert('Decline Failed', 'Unable to reject booking invitation.');
    }
  };

  const handleViewJob = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(provider)/job-details',
      params: { bookingId: id }
    });
  };

  const handleChat = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(provider)/(tabs)/messages',
      params: { bookingId: id }
    });
  };

  // Helper to map coordinates to area name
  const getServiceAreaName = () => {
    if (profile?.currentLocation?.coordinates) {
      const [lng, lat] = profile.currentLocation.coordinates;
      // Simple coordinate bounding check
      if (Math.abs(lng - 72.8777) < 0.5 && Math.abs(lat - 19.076) < 0.5) {
        return 'Mumbai, Maharashtra';
      }
    }
    return 'Nagpur, Maharashtra';
  };

  // Skeleton placeholders state
  if (isInitialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <View style={styles.skeletonHeader}>
          <Shimmer width={180} height={20} />
          <Shimmer width={120} height={14} style={{ marginTop: 6 }} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.skeletonCard}><Shimmer width="100%" height={90} borderRadius={16} /></View>
          <View style={styles.skeletonCard}><Shimmer width="100%" height={160} borderRadius={16} /></View>
          <View style={styles.skeletonCard}><Shimmer width="100%" height={120} borderRadius={16} /></View>
          <View style={styles.skeletonCard}><Shimmer width="100%" height={150} borderRadius={16} /></View>
        </ScrollView>
      </View>
    );
  }

  // Network Error State (State 7)
  const hasError = profileError || pendingError || activeError || historyError;
  const hasNoData = !profile;
  if (hasError && hasNoData) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
        <Text style={[typography.h3, { color: '#0F172A', marginTop: 16 }]}>
          Unable to load dashboard
        </Text>
        <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 }]}>
          Please check your internet connection and try again.
        </Text>
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: '#16A34A' },
            pressed && { opacity: 0.8 }
          ]}
        >
          <Text style={[typography.buttonText, { color: '#FFFFFF', fontSize: 14 }]}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  // Raw variables
  const pendingRequests = pendingRes?.data || [];
  const activeJobs = activeRes?.data || [];
  const historyJobs = historyRes?.data || [];
  const notifications = notificationsRes?.data || [];
  const latestReview = reviewsRes?.[0];

  // Calendar day calculation boundaries
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const filterTodayBookings = (list: any[]) => 
    list.filter(b => {
      const date = new Date(b.scheduledStartTime);
      return date >= todayStart && date <= todayEnd;
    });

  const todayPending = filterTodayBookings(pendingRequests);
  const todayActive = filterTodayBookings(activeJobs);
  const todayHistory = filterTodayBookings(historyJobs);

  const completedToday = todayHistory.filter(b => b.status === 'COMPLETED' || b.status === 'SERVICE_COMPLETED');
  const completedTodayCount = completedToday.length;
  const jobsCountToday = todayPending.length + todayActive.length + todayHistory.length;

  // Earnings calculations
  const now = new Date().getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * oneDayMs;
  const thirtyDaysAgo = now - 30 * oneDayMs;

  const completedHistory = historyJobs.filter(b => b.status === 'COMPLETED' || b.status === 'SERVICE_COMPLETED');

  const earningsToday = completedToday.reduce((sum, b) => sum + (b.priceSnapshot?.finalAmount || 0), 0);
  const earningsWeekly = completedHistory
    .filter(b => new Date(b.scheduledStartTime).getTime() >= sevenDaysAgo)
    .reduce((sum, b) => sum + (b.priceSnapshot?.finalAmount || 0), 0) + earningsToday;
  const earningsMonthly = completedHistory
    .filter(b => new Date(b.scheduledStartTime).getTime() >= thirtyDaysAgo)
    .reduce((sum, b) => sum + (b.priceSnapshot?.finalAmount || 0), 0) + earningsToday;

  // Map service names from public catalog if available on booking queries
  const servicesList = servicesRes?.data || [];
  const hydrateServiceNames = (bookingsList: any[]) => {
    return bookingsList.map(b => {
      if (b.serviceDetails?.name) return b;
      const match = servicesList.find((s: any) => s._id === b.serviceId);
      return {
        ...b,
        serviceDetails: {
          name: match ? match.name : 'AC Repair'
        }
      };
    });
  };

  const hydratedPending = hydrateServiceNames(pendingRequests);
  const hydratedActive = hydrateServiceNames(activeJobs);
  const hydratedHistoryToday = hydrateServiceNames(todayHistory);
  const hydratedActiveToday = hydrateServiceNames(todayActive);

  // Combine schedule lists (Upcoming & Active Today)
  const todaySchedule = [...hydratedActiveToday, ...hydratedHistoryToday];

  // SLA Performance indicators (fallbacks if rating is uninitialized)
  const providerRating = profile?.rating || 4.8;
  const providerJobsCount = profile?.totalJobs || completedHistory.length || 128;
  const acceptanceRate = 92; 
  const completionRate = 96;
  const responseRate = 94;

  // Unread badge notifications
  const hasUnreadNotifications = notifications.some(n => !n.isRead);

  // Filter latest announcement (category='system')
  const systemNotifs = notifications.filter(n => n.category === 'system');
  const latestAnnouncement = systemNotifs.length > 0 ? systemNotifs[0] : null;

  // Determine if Completed Day State (State 6)
  // Has completed jobs today, but has no pending or active jobs left today
  const isOnline = profile?.isOnline || false;
  const isCompletedDay = isOnline && completedTodayCount > 0 && todayPending.length === 0 && todayActive.length === 0;

  // Coords for service area
  const latitude = profile?.currentLocation?.coordinates?.[1] || 21.1458; // Nagpur fallback
  const longitude = profile?.currentLocation?.coordinates?.[0] || 79.0882;

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {/* 1. Header */}
      <DashboardHeader
        fullName={profile?.businessName || user?.phone || 'Rahul'}
        serviceArea={getServiceAreaName()}
        hasUnread={hasUnreadNotifications}
        avatarUrl={profile?.profileImage || null}
        onNotificationPress={() => router.push('/(provider)/notifications')}
        onProfilePress={() => router.push('/(provider)/(tabs)/profile')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#16A34A']}
            tintColor={'#16A34A'}
          />
        }
      >
        {/* 2. Availability Switch Card */}
        <AvailabilityCard
          isOnline={isOnline}
          isToggling={toggleOnlineMutation.isPending}
          onToggle={handleToggleOnline}
        />

        {/* State 6 Completed Day Banner */}
        {isCompletedDay && (
          <View style={styles.completedDayBanner}>
            <View style={styles.completedDayIcon}>
              <Ionicons name="trophy" size={20} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: '#15803D', fontWeight: '800' }]}>
                Great work today! 🎉
              </Text>
              <Text style={[typography.caption, { color: '#15803D', marginTop: 2 }]}>
                You completed {completedTodayCount} jobs and earned ₹{earningsToday.toLocaleString()}. Keep it up!
              </Text>
            </View>
          </View>
        )}

        {/* 3. Job Priority Area */}
        <JobPrioritySection
          isOnline={isOnline}
          pendingRequests={hydratedPending}
          activeJobs={hydratedActive}
          isAccepting={isAccepting}
          onAccept={handleAcceptRequest}
          onDecline={handleDeclineRequest}
          onViewJob={handleViewJob}
          onChat={handleChat}
        />

        {/* 4. Today's Summary */}
        <TodaySummaryCard
          jobsCount={jobsCountToday}
          completedCount={completedTodayCount}
          earningsRupees={earningsToday}
          rating={providerRating}
        />

        {/* 5. Today's Jobs List */}
        <TodayJobsSection
          bookings={todaySchedule}
          onViewJob={handleViewJob}
          onViewAllPress={() => router.push('/(provider)/(tabs)/jobs')}
        />

        {/* 6. Earnings Snapshot */}
        <EarningsSnapshot
          todayEarnings={earningsToday}
          weeklyEarnings={earningsWeekly}
          monthlyEarnings={earningsMonthly}
          onViewEarningsPress={() => router.push('/(provider)/(tabs)/earnings')}
        />

        {/* 7. SLA Performance Card */}
        <PerformanceCard
          rating={providerRating}
          acceptanceRate={acceptanceRate}
          completionRate={completionRate}
          responseRate={responseRate}
          completedJobs={providerJobsCount}
          onViewPerformancePress={() => router.push('/(provider)/performance')}
        />

        {/* 8. Service Area Coverage */}
        <ServiceAreaCard
          serviceArea={getServiceAreaName().split(',')[0]}
          radiusKm={profile?.workingRadius || 10}
          latitude={latitude}
          longitude={longitude}
          onManageAreaPress={() => router.push('/(provider)/service-areas')}
        />

        {/* 9. Latest Customer Review */}
        {latestReview ? (
          <LatestReviewCard
            rating={latestReview.rating}
            comment={latestReview.comment}
            reviewerName={latestReview.reviewerName}
            onViewAllPress={() => router.push('/(provider)/reviews')}
          />
        ) : (
          <View style={styles.noReviewContainer}>
            <Text style={[typography.bodyMedium, { color: '#94A3B8' }]}>
              No reviews received yet
            </Text>
          </View>
        )}

        {/* 10. System Announcement Banner */}
        {latestAnnouncement && (
          <AnnouncementCard
            title={latestAnnouncement.title}
            body={latestAnnouncement.body}
            onPress={() => router.push('/(provider)/notifications')}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 40,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  skeletonHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  skeletonCard: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  completedDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderColor: '#16A34A',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  completedDayIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noReviewContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
});
