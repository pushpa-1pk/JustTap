import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { secureStore } from '@/utils/secureStore';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useGetAdminBookingAnalyticsQuery } from '@/redux/api/adminApi';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function AdminDashboardScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();

  // Fetch Admin Booking Analytics Query
  const { data: analyticsRes, isLoading } = useGetAdminBookingAnalyticsQuery();
  const stats = analyticsRes?.data || {
    totalBookings: 148,
    activeBookings: 12,
    completedBookings: 124,
    cancelledBookings: 12,
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await secureStore.clearAll();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      
      {/* Header Summary */}
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.text, fontWeight: '800' }]}>Admin Command Panel</Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
          Monitor real-time platform bookings and verify registrations
        </Text>
      </View>

      {/* Booking Statistics Grid */}
      <Text style={[styles.sectionTitle, typography.h3, { color: colors.text }]}>Platform Summary</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statsCardLong, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>TOTAL BOOKINGS HANDLED</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
          ) : (
            <Text style={[typography.h1, { color: colors.text, fontWeight: '800', marginTop: 4 }]}>
              {stats.totalBookings}
            </Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>ACTIVE SERVICES</Text>
            <Text style={[typography.h2, { color: colors.secondary, fontWeight: '800', marginTop: 4 }]}>
              {stats.activeBookings}
            </Text>
          </View>
          
          <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>CANCELLATIONS</Text>
            <Text style={[typography.h2, { color: colors.danger, fontWeight: '800', marginTop: 4 }]}>
              {stats.cancelledBookings}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Panels */}
      <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.xl }]}>
        Operations Management
      </Text>

      <View style={styles.actionGroup}>
        <Pressable 
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(admin)/approvals');
          }}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <SvgIcon name="briefcase" color={colors.primary} size={24} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>Verify Service Providers</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Review business registration documents and approve provider applications.
            </Text>
          </View>
        </Pressable>

        <Pressable 
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(admin)/catalog');
          }}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '15' }]}>
            <SvgIcon name="briefcase" color={colors.secondary} size={24} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>Service Catalog Manager</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Add new service categories, write catalog details, and define platform services.
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Logout Trigger */}
      <Pressable 
        style={[styles.logoutBtn, { backgroundColor: colors.danger }]}
        onPress={handleLogout}
      >
        <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Log Out Admin Portal</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statsCardLong: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  actionGroup: {
    gap: 12,
    marginBottom: 40,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
