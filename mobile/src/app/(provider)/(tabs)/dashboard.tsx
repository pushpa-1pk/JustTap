import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, RefreshControl, Switch, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useGetProviderProfileQuery, useUpdateProviderOnlineStatusMutation } from '@/redux/api/profileApi';
import { useGetProviderPendingBookingsQuery, useGetProviderActiveBookingsQuery } from '@/redux/api/bookingApi';
import { useUpdateMatchingStatusMutation } from '@/redux/api/matchingApi';
import Shimmer from '@/components/common/Shimmer';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function ProviderDashboardScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // API Queries & Mutations
  const { data: profileRes, isLoading: isProfileLoading, refetch: refetchProfile } = useGetProviderProfileQuery();
  const { data: pendingBookingsRes, refetch: refetchPending } = useGetProviderPendingBookingsQuery();
  const { data: activeBookingsRes, isLoading: isActiveJobsLoading, refetch: refetchActive } = useGetProviderActiveBookingsQuery();
  
  const [updateOnlineStatus, { isLoading: isUpdatingStatus }] = useUpdateProviderOnlineStatusMutation();
  const [updateMatchingStatus] = useUpdateMatchingStatusMutation();

  const provider = profileRes?.data;
  const pendingJobs = pendingBookingsRes?.data || [];
  const activeJobs = activeBookingsRes?.data || [];
  
  const isOnline = provider?.isOnline || false;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      refetchProfile(),
      refetchPending(),
      refetchActive(),
    ]);
    setRefreshing(false);
  }, [refetchProfile, refetchPending, refetchActive]);

  const handleToggleOnline = async (value: boolean) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      // Toggle online status in both profile (DB) and matching (Redis presence)
      await updateOnlineStatus({ isOnline: value }).unwrap();
      await updateMatchingStatus({ isOnline: value }).unwrap();
    } catch (err) {
      console.error('Failed to toggle online status:', err);
    }
  };

  const handleJobPress = (bookingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(provider)/job-details',
      params: { bookingId }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* 1. Online / Offline Presence Header */}
      <View style={[styles.presenceHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.presenceTextContainer}>
          <View style={styles.row}>
            <View style={[
              styles.pulseDot, 
              { backgroundColor: isOnline ? colors.secondary : colors.textSecondary }
            ]} />
            <Text style={[typography.h3, { color: colors.text, fontWeight: '700' }]}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {isOnline ? 'Visible to nearby clients' : 'Invisible. Turn on to get jobs'}
          </Text>
        </View>

        <Switch
          value={isOnline}
          onValueChange={handleToggleOnline}
          disabled={isUpdatingStatus}
          trackColor={{ false: colors.border, true: colors.secondary + '60' }}
          thumbColor={isOnline ? colors.secondary : colors.textSecondary}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />
        }
      >
        {/* 2. STATS METRICS GRID */}
        <View style={[styles.statsGrid, { padding: spacing.lg }]}>
          <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>TODAY'S EARNINGS</Text>
            <Text style={[typography.h1, { color: colors.secondary, fontWeight: '800', marginTop: 4 }]}>₹3,450</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statsCardMini, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>ACTIVE JOBS</Text>
              <Text style={[typography.h2, { color: colors.text, fontWeight: '700', marginTop: 4 }]}>
                {activeJobs.length}
              </Text>
            </View>
            <View style={[styles.statsCardMini, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>RATING</Text>
              <Text style={[typography.h2, { color: colors.text, fontWeight: '700', marginTop: 4 }]}>
                ★ {provider?.experience ? '4.9' : '0.0'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. PENDING DISPATCHES ALERT */}
        {pendingJobs.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.alertBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
                  🚨 New Incoming Job Request!
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
                  You have {pendingJobs.length} pending service booking request. Review them now.
                </Text>
              </View>
              <Pressable
                style={[styles.acceptBtnAlert, { backgroundColor: colors.warning }]}
                onPress={() => router.push('/(provider)/(tabs)/jobs')}
              >
                <Text style={[typography.buttonText, { color: '#FFFFFF', fontSize: 13 }]}>Review</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 4. ACTIVE SCHEDULE LIST */}
        <View style={styles.section}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md, paddingHorizontal: spacing.lg }]}>
            Active Schedules
          </Text>

          {isActiveJobsLoading ? (
            <View style={{ paddingHorizontal: 24, gap: 16 }}>
              {[1, 2].map(k => (
                <View key={k} style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Shimmer width={180} height={18} />
                  <Shimmer width={120} height={12} style={{ marginTop: 8 }} />
                </View>
              ))}
            </View>
          ) : activeJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <SvgIcon name="briefcase" color={colors.textSecondary} size={40} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                No jobs scheduled for today
              </Text>
            </View>
          ) : (
            <FlatList
              data={activeJobs}
              keyExtractor={(item) => item._id || item.id}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const start = new Date(item.scheduledStartTime);
                const timeStr = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                return (
                  <Pressable
                    style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleJobPress(item._id || item.id)}
                  >
                    <View style={styles.jobRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodySmall, { color: colors.secondary, fontWeight: '700' }]}>
                          ⏰ STARTING AT {timeStr}
                        </Text>
                        <Text style={[typography.h3, { color: colors.text, marginTop: 4, fontWeight: '700' }]}>
                          Job: #{item._id.substring(item._id.length - 6).toUpperCase()}
                        </Text>
                        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                          📍 {item.customerAddressSnapshot?.addressLine1}, {item.customerAddressSnapshot?.city}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
                          {item.status.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  presenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  presenceTextContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statsGrid: {
    gap: 12,
  },
  statsCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCardMini: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  section: {
    marginBottom: 20,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginHorizontal: 24,
  },
  acceptBtnAlert: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  jobCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
