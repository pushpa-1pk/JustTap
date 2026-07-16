import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useGetNotificationsQuery } from '@/redux/api/notificationApi';
import SvgIcon from '@/components/common/SvgIcon';
import Shimmer from '@/components/common/Shimmer';
import * as Haptics from 'expo-haptics';

export default function ProviderNotificationsScreen() {
  const { colors, typography, spacing } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // API Query
  const { data: notifsRes, isLoading, refetch } = useGetNotificationsQuery();
  const notifications = notifsRes?.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'booking':
        return { name: 'briefcase', color: colors.secondary };
      case 'payment':
        return { name: 'briefcase', color: colors.secondary };
      case 'review':
        return { name: 'briefcase', color: colors.accent };
      default:
        return { name: 'briefcase', color: colors.textSecondary };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.listContainer}>
          {[1, 2, 3].map(k => (
            <View key={k} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Shimmer width={180} height={16} />
              <Shimmer width={'90%'} height={12} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <SvgIcon name="briefcase" color={colors.textSecondary} size={48} />
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>
            No Alerts Received
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
            Incoming customer bookings and payout confirmations will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />
          }
          renderItem={({ item }) => {
            const iconConfig = getCategoryIcon(item.category);
            const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return (
              <View style={[
                styles.card, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  borderLeftColor: iconConfig.color,
                  borderLeftWidth: 4 
                }
              ]}>
                <View style={styles.cardHeader}>
                  <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
                    {item.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {dateStr}
                  </Text>
                </View>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
                  {item.body}
                </Text>
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
  listContainer: {
    padding: 24,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
