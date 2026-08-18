import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, Text, RefreshControl, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';

import { useTheme } from '../../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { socketService } from '../../../services/socket';
import { notificationService } from '../../../services/notifications';
import { jobApi } from '../../../api/jobApi';

import { useGetDashboardData, useToggleOnlineStatus } from '../../../hooks/useProviderProfile';
import { RootState } from '../../../redux/store';
import { setActiveJob, setTodayEarnings } from '../../../redux/slices/providerSlice';

import { DashboardHeader } from './DashboardHeader';
import { AvailabilityCard } from './AvailabilityCard';
import { NewJobRequestCard } from './NewJobRequestCard';
import { TodaySummary } from './TodaySummary';
import { ReferralBonus } from './ReferralBonus';
import { RecentActivity } from './RecentActivity';
import { ActiveJobBanner } from './ActiveJobBanner';
import { QuickActions } from './QuickActions';

export const ProviderDashboard: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  // 1. Redux state (Section 4g logout check & active status)
  const activeJob = useSelector((state: RootState) => state.provider.activeJob);

  // 2. React Query for all server states (Section 2)
  const {
    data: dashboardData,
    isLoading: initialLoading,
    isRefetching: refreshing,
    refetch: refetchDashboard,
    isError: loadError,
  } = useGetDashboardData();

  const toggleOnlineMutation = useToggleOnlineStatus();

  const profile = dashboardData?.profile;
  const dashboardStats = dashboardData?.stats;
  const recentJobs = dashboardData?.recentJobs || [];
  const pendingRequests = dashboardData?.pendingRequests || [];

  const isOnline = profile?.isOnline ?? false;
  const isAvailabilityUpdating = toggleOnlineMutation.isPending;

  const [isAcceptingJob, setIsAcceptingJob] = useState(false);

  // Synchronize Today's earnings with provider Redux state (Section 30 Today source of truth)
  useEffect(() => {
    if (dashboardStats?.todayEarnings !== undefined) {
      dispatch(setTodayEarnings(dashboardStats.todayEarnings));
    }
  }, [dashboardStats?.todayEarnings, dispatch]);

  // Initialize Socket.IO and Notification Listeners (Requirement 30 & 31)
  useEffect(() => {
    socketService.connect();
    const cleanupNotifications = notificationService.setupNotificationListeners();
    notificationService.registerForPushNotificationsAsync();

    const socket = socketService.getSocket();
    if (socket) {
      socket.on('booking:new', () => refetchDashboard());
      socket.on('booking:cancelled', () => refetchDashboard());
    }

    return () => {
      socketService.disconnect();
      cleanupNotifications();
    };
  }, [refetchDashboard]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetchDashboard();
  };

  // Toggle availability flow (Section 4a & 4b)
  const handleToggleAvailability = async (nextOnlineState: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await toggleOnlineMutation.mutateAsync(nextOnlineState);
      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Connection Error',
        nextOnlineState 
          ? "Couldn't go online — check your connection" 
          : "Couldn't go offline — check your connection"
      );
    }
  };

  // Accept inline pending request action
  const handleAcceptInlineRequest = async (id: string) => {
    setIsAcceptingJob(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const response = await jobApi.acceptJob(id);
      if (response && response.success) {
        const booking = response.data;
        dispatch(setActiveJob({
          id: booking._id || booking.id,
          serviceName: booking.serviceDetails?.name || 'AC Repair',
          status: booking.status || 'ACCEPTED',
          etaMinutes: 10,
        }));

        refetchDashboard();

        router.push({
          pathname: '/(provider)/job-tracking',
          params: { jobId: booking._id || booking.id },
        });
      } else {
        throw new Error('Offer already taken');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Unavailable', 'This job is no longer available.');
      refetchDashboard();
    } finally {
      setIsAcceptingJob(false);
    }
  };

  // Reject inline pending request action
  const handleRejectInlineRequest = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await jobApi.rejectJob(id);
      refetchDashboard();
    } catch (err) {
      console.warn('[Dashboard] Reject inline failed:', err);
    }
  };

  // Render Skeleton Placeholders (Requirement 33)
  if (initialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <View style={[styles.skeletonHeader, { borderBottomColor: colors.border }]}>
          <View style={[styles.skeletonBar, { width: 140, backgroundColor: colors.border }]} />
          <View style={[styles.skeletonBar, { width: 80, height: 12, marginTop: 8, backgroundColor: colors.border }]} />
        </View>
        <View style={styles.skeletonBody}>
          <View style={[styles.skeletonCard, { height: 96, backgroundColor: colors.border }]} />
          <View style={[styles.skeletonCard, { height: 120, backgroundColor: colors.border }]} />
          <View style={[styles.skeletonCard, { height: 240, backgroundColor: colors.border }]} />
        </View>
      </View>
    );
  }

  // Network Failure Screen (Requirement 34)
  if (loadError && !dashboardStats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
          <Text style={[typography.h2, { color: colors.text, marginTop: 16, textAlign: 'center' }]}>
            Couldn't refresh your dashboard
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }]}>
            Please verify your network connection and try again.
          </Text>
          <Pressable
            onPress={handleRefresh}
            style={({ pressed }) => [
              styles.retryBtn,
              { backgroundColor: colors.secondary },
              pressed && { opacity: 0.8 }
            ]}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const sections = ['availability', 'new_job_request', 'summary', 'referral', 'actions', 'activity'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      {/* Dynamic Header */}
      <DashboardHeader
        businessName={profile?.businessName || 'Provider'}
        profileImage={profile?.profileImage || null}
        onAvatarPress={() => router.push('/(provider)/(tabs)/profile')}
      />

      {/* Persistent Active Job Banner */}
      {activeJob && (
        <ActiveJobBanner
          serviceName={activeJob.serviceName}
          etaMinutes={activeJob.etaMinutes}
          status={activeJob.status}
          onPress={() => router.push({
            pathname: '/(provider)/job-tracking',
            params: { jobId: activeJob.id }
          })}
        />
      )}

      {/* Virtualized list for highest scrolling performance */}
      <FlatList
        data={sections}
        renderItem={({ item }) => {
          switch (item) {
            case 'availability':
              return (
                <AvailabilityCard
                  isOnline={isOnline}
                  isUpdating={isAvailabilityUpdating}
                  workingRadius={profile?.workingRadius || 2.5}
                  onToggle={handleToggleAvailability}
                />
              );
            case 'new_job_request':
              const topPending = pendingRequests && pendingRequests.length > 0 ? pendingRequests[0] : null;
              const mappedJob = topPending ? {
                id: topPending._id || topPending.id,
                customerName: topPending.customerSnapshot?.fullName || 'Customer',
                distanceKm: topPending.distanceKm || 2.5,
                serviceName: topPending.serviceDetails?.name || 'AC Servicing',
                price: topPending.priceSnapshot?.finalAmount || topPending.snapshotPricing?.totalAmountToPay || 499,
                timeWindow: 'Within 30 mins'
              } : null;
              
              if (activeJob !== null) return null;

              return (
                <NewJobRequestCard
                  job={mappedJob}
                  isAccepting={isAcceptingJob}
                  onAccept={handleAcceptInlineRequest}
                  onReject={handleRejectInlineRequest}
                  onViewAll={() => router.push('/(provider)/(tabs)/jobs')}
                />
              );
            case 'summary':
              return dashboardStats ? (
                <TodaySummary
                  jobsCount={dashboardStats.todayJobs}
                  completedCount={dashboardStats.completedJobs}
                  rating={dashboardStats.rating}
                  weeklyEarnings={dashboardStats.weeklyEarnings}
                />
              ) : null;
            case 'referral':
              return <ReferralBonus />;
            case 'actions':
              return activeJob === null ? (
                <QuickActions
                  onSchedulePress={() => router.push('/(provider)/(tabs)/jobs')}
                  onAvailabilityPress={() => router.push('/(provider)/working-hours')}
                  onSupportPress={() => Alert.alert('Help Support', 'Connecting you to support dispatcher...')}
                />
              ) : null;
            case 'activity':
              return (
                <RecentActivity
                  jobs={recentJobs}
                  onViewAllPress={() => router.push('/(provider)/(tabs)/jobs')}
                />
              );
            default:
              return null;
          }
        }}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={handleRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryBtn: {
    marginTop: 24,
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  skeletonHeader: {
    height: 72,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
  },
  skeletonBar: {
    height: 18,
    borderRadius: 4,
  },
  skeletonBody: {
    padding: 20,
    gap: 16,
  },
  skeletonCard: {
    borderRadius: 16,
    width: '100%',
  },
});
