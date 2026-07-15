import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useGetCustomerBookingsQuery } from '@/redux/api/bookingApi';
import Shimmer from '@/components/common/Shimmer';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function CustomerBookingsScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Booking History Query
  const { data: bookingsRes, isLoading, refetch, isError } = useGetCustomerBookingsQuery();
  const bookings = bookingsRes?.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Segment bookings
  const activeBookings = bookings.filter(b => 
    !['COMPLETED', 'CANCELLED', 'FAILED', 'DISPUTED'].includes(b.status)
  );
  
  const pastBookings = bookings.filter(b => 
    ['COMPLETED', 'CANCELLED', 'FAILED', 'DISPUTED'].includes(b.status)
  );

  const displayList = activeTab === 'active' ? activeBookings : pastBookings;

  const handleBookingPress = (bookingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(customer)/booking-details',
      params: { bookingId }
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING_PROVIDER_RESPONSE':
        return { bg: colors.warning + '15', text: colors.warning, label: 'Pending Response' };
      case 'PROVIDER_ACCEPTED':
        return { bg: colors.secondary + '15', text: colors.secondary, label: 'Accepted' };
      case 'ON_THE_WAY':
        return { bg: colors.accent + '15', text: colors.accent, label: 'On The Way' };
      case 'ARRIVED':
        return { bg: colors.accent + '15', text: colors.accent, label: 'Provider Arrived' };
      case 'SERVICE_STARTED':
        return { bg: colors.secondary + '15', text: colors.secondary, label: 'Service Started' };
      case 'SERVICE_COMPLETED':
        return { bg: colors.secondary + '15', text: colors.secondary, label: 'Service Completed' };
      case 'COMPLETED':
        return { bg: colors.secondary + '15', text: colors.secondary, label: 'Completed' };
      case 'CANCELLED':
        return { bg: colors.danger + '15', text: colors.danger, label: 'Cancelled' };
      default:
        return { bg: colors.border, text: colors.textSecondary, label: status };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dynamic Tab Switchers */}
      <View style={[styles.tabsHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'active' && { borderBottomColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('active');
          }}
        >
          <Text style={[
            typography.bodyMedium, 
            { 
              color: activeTab === 'active' ? colors.primary : colors.textSecondary,
              fontWeight: activeTab === 'active' ? '700' : '400' 
            }
          ]}>
            Active ({activeBookings.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'past' && { borderBottomColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('past');
          }}
        >
          <Text style={[
            typography.bodyMedium, 
            { 
              color: activeTab === 'past' ? colors.primary : colors.textSecondary,
              fontWeight: activeTab === 'past' ? '700' : '400' 
            }
          ]}>
            History ({pastBookings.length})
          </Text>
        </Pressable>
      </View>

      {/* Bookings List */}
      {isLoading ? (
        <View style={styles.listContainer}>
          {[1, 2].map(k => (
            <View key={k} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Shimmer width={180} height={18} />
              <Shimmer width={100} height={12} style={{ marginTop: 8 }} />
              <Shimmer width={'100%'} height={40} style={{ marginTop: 16 }} />
            </View>
          ))}
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={[typography.bodyLarge, { color: colors.danger }]}>Network connection failed.</Text>
        </View>
      ) : displayList.length === 0 ? (
        <View style={styles.centerContainer}>
          <SvgIcon name="briefcase" color={colors.textSecondary} size={48} />
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>
            No Bookings Found
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
            {activeTab === 'active' ? "You don't have any active service requests." : "Your past bookings will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item._id || item.id || ''}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => {
            const statusConfig = getStatusStyle(item.status);
            const dateStr = new Date(item.scheduledStartTime).toLocaleDateString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric'
            });
            const timeStr = new Date(item.scheduledStartTime).toLocaleTimeString(undefined, {
              hour: '2-digit', minute: '2-digit'
            });

            return (
              <Pressable
                style={[
                  styles.card, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: colors.border,
                    shadowColor: colors.text 
                  }
                ]}
                onPress={() => handleBookingPress(item._id || item.id || '')}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                      📅 {dateStr} at {timeStr}
                    </Text>
                    <Text style={[typography.h3, { color: colors.text, marginTop: 4, fontWeight: '700' }]}>
                      {item.priceSnapshot ? 'Service Completed' : 'Provider Assigned'}
                    </Text>
                    <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]}>
                      Amt: ₹{item.priceSnapshot?.finalAmount || item.priceSnapshot?.basePrice || 499}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <Text style={[typography.caption, { color: statusConfig.text, fontWeight: '800' }]}>
                      {statusConfig.label.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Footer details card link */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}>
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                    Track Progress & Timeline
                  </Text>
                  <SvgIcon name="briefcase" color={colors.primary} size={16} />
                </View>
              </Pressable>
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardFooter: {
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
