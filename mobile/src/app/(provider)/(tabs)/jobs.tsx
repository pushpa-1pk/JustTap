import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Alert, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../hooks/useTheme';
import { useGetProviderJobs, useUpdateJobStatusMutation } from '../../../hooks/useProviderProfile';
import { RootState } from '../../../redux/store';
import { setActiveJob } from '../../../redux/slices/providerSlice';
import { socketService } from '../../../services/socket';

import { JobsHeader } from '../../../components/provider/jobs/JobsHeader';
import { JobsTabs } from '../../../components/provider/jobs/JobsTabs';
import { JobList } from '../../../components/provider/jobs/JobList';
import { JobSkeleton } from '../../../components/provider/jobs/JobSkeleton';
import { JobErrorState } from '../../../components/provider/jobs/JobErrorState';
import { JobFilterSheet } from '../../../components/provider/jobs/JobFilterSheet';
import { ProviderJob, JobStatus, PaymentStatus } from '../../../types/job';

type TabType = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function JobsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // 1. Redux activeJob bindings (Section 4g and Cross-screen consistency)
  const activeJob = useSelector((state: RootState) => state.provider.activeJob);

  // 2. Local filters and states
  const [selectedTab, setSelectedTab] = useState<TabType>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setFilter] = useState<any>({ serviceType: '', paymentStatus: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 3. Debounced Search timer (Section 6 - 300ms)
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 4. React Query queries and mutations
  const {
    data: jobsData,
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useGetProviderJobs({
    status: selectedTab,
    page: currentPage,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const updateStatusMutation = useUpdateJobStatusMutation();

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  const handleLoadMore = () => {
    if (jobsData?.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Socket.IO updates (Section 27)
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleJobUpdated = () => {
      refetch();
    };

    socket.on('job:assigned', handleJobUpdated);
    socket.on('job:updated', handleJobUpdated);
    socket.on('job:cancelled', handleJobUpdated);
    socket.on('job:completed', () => {
      dispatch(setActiveJob(null));
      refetch();
    });

    return () => {
      socket.off('job:assigned');
      socket.off('job:updated', handleJobUpdated);
      socket.off('job:cancelled');
      socket.off('job:completed');
    };
  }, [dispatch, refetch]);

  // Status mapping functions
  const mapStatusToJobStatus = (status: string): JobStatus => {
    switch (status) {
      case 'PENDING_PROVIDER_RESPONSE':
      case 'REQUESTED':
        return 'SCHEDULED';
      case 'PROVIDER_ACCEPTED':
      case 'ACCEPTED':
        return 'ACCEPTED';
      case 'ON_THE_WAY':
        return 'ON_THE_WAY';
      case 'ARRIVED':
        return 'ARRIVED';
      case 'SERVICE_STARTED':
        return 'SERVICE_STARTED';
      case 'COMPLETED':
      case 'SERVICE_COMPLETED':
        return 'COMPLETED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'SCHEDULED';
    }
  };

  const mapStatusToPaymentStatus = (status: string): PaymentStatus => {
    if (status === 'PAID' || status === 'COMPLETED') return 'COMPLETED';
    if (status === 'REFUNDED') return 'REFUNDED';
    return 'PENDING';
  };

  const isUpcomingByTime = (scheduledAt: string) => {
    try {
      const timeDiff = new Date(scheduledAt).getTime() - Date.now();
      return timeDiff > 30 * 60 * 1000;
    } catch {
      return true;
    }
  };

  // Convert raw API bookings into typed ProviderJob objects
  const jobsList = useMemo((): ProviderJob[] => {
    const rawDocs = jobsData?.data || [];
    const list = Array.isArray(rawDocs) ? rawDocs : (rawDocs.docs || []);

    return list.map((j: any): ProviderJob => ({
      id: j._id || j.id,
      serviceName: j.serviceName || j.serviceDetails?.name || 'Local Service',
      serviceType: j.bookingType || 'HVAC',
      customer: {
        id: j.customerId || '',
        firstName: j.customerSnapshot?.fullName?.split(' ')[0] || 'Customer',
        rating: 4.8,
      },
      scheduledAt: j.scheduledStartTime || new Date().toISOString(),
      hasStartedTravel: j.status === 'ON_THE_WAY' || j.status === 'ARRIVED' || j.status === 'SERVICE_STARTED',
      status: mapStatusToJobStatus(j.status),
      paymentStatus: mapStatusToPaymentStatus(j.paymentStatus || 'PENDING'),
      estimatedEarnings: j.priceSnapshot?.finalAmount || j.snapshotPricing?.totalAmountToPay || 450,
    }));
  }, [jobsData]);

  // Client-side combined filtering & sorting
  const filteredJobsList = useMemo(() => {
    let result = jobsList;

    // Tab filtering constraints
    if (selectedTab === 'UPCOMING' && activeJob) {
      result = result.filter((j) => j.id !== activeJob.id);
    }

    if (selectedTab === 'UPCOMING') {
      result = result.filter((j) => (j.status === 'SCHEDULED' || j.status === 'ACCEPTED') && !j.hasStartedTravel);
      // Sort upcoming by closest scheduledAt timestamp (Section 12)
      result = [...result].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    } else if (selectedTab === 'ACTIVE') {
      result = []; // Active tab lists active banner only
    } else if (selectedTab === 'COMPLETED') {
      result = result.filter((j) => j.status === 'COMPLETED');
    } else if (selectedTab === 'CANCELLED') {
      result = result.filter((j) => j.status === 'CANCELLED');
    }

    // Apply sheet filters (AND combined)
    if (activeFilter.serviceType) {
      result = result.filter((j) => j.serviceType === activeFilter.serviceType);
    }
    if (activeFilter.paymentStatus) {
      result = result.filter((j) => j.paymentStatus === activeFilter.paymentStatus);
    }

    return result;
  }, [jobsList, selectedTab, activeJob, activeFilter]);

  const handleActionPress = async (jobId: string, currentStatus: string) => {
    let nextStatus: JobStatus = 'ON_THE_WAY';

    if (currentStatus === 'ACCEPTED') nextStatus = 'ON_THE_WAY';
    else if (currentStatus === 'ON_THE_WAY') nextStatus = 'ARRIVED';
    else if (currentStatus === 'ARRIVED') nextStatus = 'SERVICE_STARTED';
    else if (currentStatus === 'SERVICE_STARTED') nextStatus = 'COMPLETED';

    setIsActionLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await updateStatusMutation.mutateAsync({ jobId, nextStatus });
      if (res && res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (nextStatus === 'COMPLETED') {
          dispatch(setActiveJob(null));
          Alert.alert('Fulfillment Completed', 'Service booking completed successfully!');
        } else {
          dispatch(setActiveJob({
            id: jobId,
            serviceName: activeJob?.serviceName || 'AC Repair',
            status: nextStatus,
            etaMinutes: activeJob?.etaMinutes || 8,
          }));
        }
        refetch();
      } else {
        throw new Error('Action failed');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Out of Sync', 'This job has already been updated. Refreshing details...');
      refetch();
    } finally {
      setIsActionLoading(false);
    }
  };

  const mappedActiveJob = activeJob
    ? jobsList.find((j) => j.id === activeJob.id) || {
        id: activeJob.id,
        serviceName: activeJob.serviceName,
        serviceType: 'HVAC',
        customer: { id: '', firstName: 'Customer', rating: 5.0 },
        scheduledAt: new Date().toISOString(),
        hasStartedTravel: true,
        status: activeJob.status as JobStatus,
        paymentStatus: 'PENDING' as const,
        estimatedEarnings: 450,
      }
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      {/* Search and Action Header */}
      <JobsHeader
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchToggle={setIsSearching}
        onSearchChange={setSearchQuery}
        onFilterPress={() => setFilterSheetVisible(true)}
      />

      {/* Tabs */}
      <JobsTabs activeTab={selectedTab} onTabChange={setSelectedTab} />

      {/* List content */}
      {isLoading && !isRefetching ? (
        <JobSkeleton />
      ) : isError && filteredJobsList.length === 0 ? (
        <JobErrorState onRetry={() => refetch()} />
      ) : (
        <JobList
          tab={selectedTab}
          jobs={filteredJobsList}
          activeJob={mappedActiveJob as ProviderJob | null}
          isActionLoading={isActionLoading}
          onActionPress={handleActionPress}
          onOpenTracking={(id) => {
            router.push({
              pathname: '/(provider)/job-tracking',
              params: { jobId: id },
            });
          }}
          onCardPress={(id) => {
            router.push({
              pathname: '/(provider)/job-details',
              params: { bookingId: id },
            });
          }}
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          loadingMore={isLoading}
          onLoadMore={handleLoadMore}
          hasNextPage={!!jobsData?.hasNextPage}
        />
      )}

      {/* Status Filter choices */}
      <JobFilterSheet
        visible={filterSheetVisible}
        activeFilter={activeFilter}
        onClose={() => setFilterSheetVisible(false)}
        onApply={setFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
