import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { 
  useGetProviderPendingBookingsQuery, 
  useGetProviderActiveBookingsQuery, 
  useGetProviderBookingHistoryQuery,
  useAcceptBookingMutation 
} from '@/redux/api/bookingApi';
import Shimmer from '@/components/common/Shimmer';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

type ProviderJobsTab = 'pending' | 'active' | 'history';

export default function ProviderJobsScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProviderJobsTab>('pending');
  const [refreshing, setRefreshing] = useState(false);

  // API Queries & Mutations
  const { data: pendingRes, isLoading: isPendingLoading, refetch: refetchPending } = useGetProviderPendingBookingsQuery();
  const { data: activeRes, isLoading: isActiveLoading, refetch: refetchActive } = useGetProviderActiveBookingsQuery();
  const { data: historyRes, isLoading: isHistoryLoading, refetch: refetchHistory } = useGetProviderBookingHistoryQuery();
  const [acceptBooking, { isLoading: isAccepting }] = useAcceptBookingMutation();

  const pendingRequests = pendingRes?.data || [];
  const activeJobs = activeRes?.data || [];
  const historyJobs = historyRes?.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      refetchPending(),
      refetchActive(),
      refetchHistory()
    ]);
    setRefreshing(false);
  }, [refetchPending, refetchActive, refetchHistory]);

  const handleAcceptRequest = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const response = await acceptBooking(id).unwrap();
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Refresh queues
        refetchPending();
        refetchActive();
        // Redirect to job execution
        router.push({
          pathname: '/(provider)/job-details',
          params: { bookingId: id }
        });
      }
    } catch (err) {
      console.error('Accept job failed:', err);
    }
  };

  const handleDeclineRequest = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Providers can decline, or just refresh the queue
    alert('Declined booking request invitation');
    refetchPending();
  };

  const handleActiveJobPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(provider)/job-details',
      params: { bookingId: id }
    });
  };

  const getLoadingState = () => {
    if (activeTab === 'pending') return isPendingLoading;
    if (activeTab === 'active') return isActiveLoading;
    return isHistoryLoading;
  };

  const getDisplayData = () => {
    if (activeTab === 'pending') return pendingRequests;
    if (activeTab === 'active') return activeJobs;
    return historyJobs;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Selectors */}
      <View style={[styles.tabsHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'pending' && { borderBottomColor: colors.secondary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('pending');
          }}
        >
          <Text style={[
            typography.bodyMedium, 
            { 
              color: activeTab === 'pending' ? colors.secondary : colors.textSecondary,
              fontWeight: activeTab === 'pending' ? '700' : '400' 
            }
          ]}>
            Pending ({pendingRequests.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'active' && { borderBottomColor: colors.secondary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('active');
          }}
        >
          <Text style={[
            typography.bodyMedium, 
            { 
              color: activeTab === 'active' ? colors.secondary : colors.textSecondary,
              fontWeight: activeTab === 'active' ? '700' : '400' 
            }
          ]}>
            Active ({activeJobs.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'history' && { borderBottomColor: colors.secondary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('history');
          }}
        >
          <Text style={[
            typography.bodyMedium, 
            { 
              color: activeTab === 'history' ? colors.secondary : colors.textSecondary,
              fontWeight: activeTab === 'history' ? '700' : '400' 
            }
          ]}>
            History ({historyJobs.length})
          </Text>
        </Pressable>
      </View>

      {/* Jobs Lists */}
      {getLoadingState() ? (
        <View style={styles.listContainer}>
          {[1, 2].map(k => (
            <View key={k} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Shimmer width={180} height={18} />
              <Shimmer width={100} height={12} style={{ marginTop: 8 }} />
              <Shimmer width={'100%'} height={40} style={{ marginTop: 16 }} />
            </View>
          ))}
        </View>
      ) : getDisplayData().length === 0 ? (
        <View style={styles.centerContainer}>
          <SvgIcon name="briefcase" color={colors.textSecondary} size={48} />
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>
            No Jobs Available
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
            {activeTab === 'pending' ? "You don't have any incoming request dispatches." : activeTab === 'active' ? "You don't have any active schedules." : "Your past jobs will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={getDisplayData()}
          keyExtractor={(item) => item._id || item.id || ''}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />
          }
          renderItem={({ item }) => {
            const start = new Date(item.scheduledStartTime);
            const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Header summary */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                      📅 {dateStr} at {timeStr}
                    </Text>
                    <Text style={[typography.h3, { color: colors.text, marginTop: 4, fontWeight: '700' }]}>
                      Booking: #{item._id.substring(item._id.length - 6).toUpperCase()}
                    </Text>
                    <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]}>
                      Address: {item.customerAddressSnapshot?.addressLine1}, {item.customerAddressSnapshot?.city}
                    </Text>
                    <Text style={[typography.h2, { color: colors.secondary, fontWeight: '800', marginTop: spacing.xs }]}>
                      Payout: ₹{item.priceSnapshot?.finalAmount || item.priceSnapshot?.basePrice}
                    </Text>
                  </View>
                </View>

                {/* Conditional Actions inside the card footer */}
                {activeTab === 'pending' && (
                  <View style={[styles.btnRow, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}>
                    <Pressable
                      style={[styles.declineBtn, { borderColor: colors.border }]}
                      onPress={() => handleDeclineRequest(item._id)}
                    >
                      <Text style={[typography.buttonText, { color: colors.text, fontSize: 13 }]}>Decline</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.acceptBtn, { backgroundColor: colors.secondary }]}
                      onPress={() => handleAcceptRequest(item._id)}
                      disabled={isAccepting}
                    >
                      {isAccepting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={[typography.buttonText, { color: '#FFFFFF', fontSize: 13 }]}>Accept Job</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                {activeTab === 'active' && (
                  <Pressable
                    style={[styles.linkBtn, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}
                    onPress={() => handleActiveJobPress(item._id)}
                  >
                    <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                      Open Stepper & OTP Verification
                    </Text>
                    <SvgIcon name="briefcase" color={colors.secondary} size={16} />
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsHeader: {
    flexDirection: 'row',
    height: 52,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  listContainer: {
    padding: 24,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
  },
  declineBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    flex: 2,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
