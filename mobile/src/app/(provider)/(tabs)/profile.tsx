import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Switch, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGetProviderProfile, useToggleOnlineStatus } from '@/hooks/useProviderProfile';
import { useSwitchRole } from '@/hooks/useProfile';
import { logout, switchRole } from '@/redux/slices/authSlice';
import { RootState } from '@/redux/store';
import { secureStore } from '@/utils/secureStore';
import { AppUserRole, getDefaultRouteForRole } from '@/utils/auth';
import { useTheme } from '@/hooks/useTheme';

export default function ProviderProfileScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const user = useSelector((state: RootState) => state.auth.user);
  const roles = user?.roles || ['PROVIDER'];

  // Queries & Mutations
  const { data: profile, isLoading, isRefetching, refetch } = useGetProviderProfile();
  const toggleOnlineMutation = useToggleOnlineStatus();
  const switchRoleMutation = useSwitchRole();

  const handleToggleOnline = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await toggleOnlineMutation.mutateAsync(value);
      refetch();
    } catch (err) {
      console.error('Toggle online status failed:', err);
    }
  };

  const handleSwitchRole = async (role: AppUserRole) => {
    if (!roles.includes(role)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await switchRoleMutation.mutateAsync(role);
      router.replace(getDefaultRouteForRole(role));
    } catch (err) {
      console.error('Role switch failed:', err);
      Alert.alert('Error', 'Failed to switch role. Please try again.');
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await secureStore.clearAll();
    queryClient.clear();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  // Fallback defaults if no profile exists
  const displayName = profile?.businessName || user?.phone || 'Service Provider';
  const providerId = profile?.userId ? `SP-${profile.userId.slice(-6).toUpperCase()}` : 'SP-PENDING';
  const rating = profile?.rating || 0.0;
  const jobs = profile?.totalJobs || 0;
  const isOnline = profile?.isOnline ?? false;
  const expYears = profile?.experience || 0;
  const radius = profile?.workingRadius || 10;
  const avatar = profile?.profileImage || null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.secondary} />
      }
    >
      {/* Profile Header Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerInfoRow}>
          {avatar ? (
            <ExpoImage source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="business" size={36} color={colors.textSecondary} />
            </View>
          )}

          <View style={styles.headerTextCol}>
            <View style={styles.nameRow}>
              <Text style={[typography.h3, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>
                {displayName}
              </Text>
              {profile?.verificationStatus === 'approved' && (
                <Ionicons name="checkmark-circle" size={18} color={colors.secondary} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>ID: {providerId}</Text>
            <Text style={[typography.bodySmall, { color: colors.secondary, fontWeight: '700', marginTop: 2 }]}>
              Plumbing & Repair Expert
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Member since: Aug 2026</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Contact info details */}
        <View style={styles.contactContainer}>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
            <Text style={[typography.caption, { color: colors.text, marginLeft: 6 }]}>+91 {user?.phone || '9999999999'}</Text>
          </View>
          <View style={[styles.contactRow, { marginTop: 6 }]}>
            <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
            <Text style={[typography.caption, { color: colors.text, marginLeft: 6 }]}>{profile?.email || 'payouts@justtap.com'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Online toggler and status */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
              Duty Status: {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {isOnline ? 'Accepting dispatch calls' : 'Toggle online to receive jobs'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
            thumbColor={isOnline ? colors.secondary : '#94A3B8'}
          />
        </View>
      </View>

      {/* Verification Warning Gated Banner */}
      {profile?.verificationStatus !== 'approved' && (
        <View style={[styles.warningCard, { backgroundColor: colors.warning + '12', borderColor: colors.warning }]}>
          <Ionicons name="warning" size={20} color={colors.warning} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[typography.bodySmall, { color: colors.warning, fontWeight: '700' }]}>
              Verification Status: {profile?.verificationStatus?.toUpperCase() || 'PENDING'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Please upload all required KYC Documents to unlock full job dispatches.
            </Text>
          </View>
        </View>
      )}

      {/* Profile Statistics Widgets */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>RATING</Text>
          <Text style={[typography.h3, { color: colors.primary, fontWeight: '800', marginTop: 4 }]}>
            ★ {rating.toFixed(1)}
          </Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>JOBS DONE</Text>
          <Text style={[typography.h3, { color: colors.text, fontWeight: '800', marginTop: 4 }]}>
            {jobs}
          </Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>EXPERIENCE</Text>
          <Text style={[typography.h3, { color: colors.text, fontWeight: '800', marginTop: 4 }]}>
            {expYears} yrs
          </Text>
        </View>
      </View>

      {/* Switch Roles Segment */}
      {roles.length > 1 && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.sectionTitle}>Switch Role Platform</Text>
          <View style={styles.segmentRow}>
            {roles.map((role) => (
              <Pressable
                key={role}
                style={[
                  styles.segment,
                  { borderColor: colors.border },
                  user?.role === role && { backgroundColor: colors.secondary, borderColor: colors.secondary }
                ]}
                onPress={() => handleSwitchRole(role)}
              >
                <Text style={[
                  typography.bodySmall,
                  { color: colors.text, fontWeight: '600' },
                  user?.role === role && { color: colors.onSecondary, fontWeight: '800' }
                ]}>
                  {role === 'PROVIDER' ? 'Provider Portal' : 'Customer View'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Profile menu rows */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>Profile Configurations</Text>
        
        <MenuRow 
          title="Edit Profile" 
          icon="create" 
          onPress={() => router.push('/edit-profile' as any)} 
          colors={colors} 
          typography={typography} 
        />
        
        <MenuRow 
          title="Business Details" 
          icon="business" 
          onPress={() => router.push('/business-info' as any)} 
          colors={colors} 
          typography={typography} 
        />

        <MenuRow 
          title="Service Management" 
          icon="construct" 
          onPress={() => router.push('/services' as any)} 
          colors={colors} 
          typography={typography} 
        />

        <MenuRow 
          title="Manage Service Areas" 
          icon="map" 
          onPress={() => router.push('/service-areas' as any)} 
          colors={colors} 
          typography={typography} 
        />

        <MenuRow 
          title="Configure Working Hours" 
          icon="time" 
          onPress={() => router.push('/working-hours' as any)} 
          colors={colors} 
          typography={typography} 
        />

        <MenuRow 
          title="Identity Verification KYC" 
          icon="document-text" 
          onPress={() => router.push('/kyc-upload' as any)} 
          colors={colors} 
          typography={typography} 
        />

        <MenuRow 
          title="Wallet & Payouts" 
          icon="wallet" 
          onPress={() => router.push('/wallet' as any)} 
          colors={colors} 
          typography={typography} 
        />

        <MenuRow 
          title="Bank Details Setup" 
          icon="card" 
          onPress={() => router.push('/bank-setup' as any)} 
          colors={colors} 
          typography={typography} 
        />

        <MenuRow 
          title="Customer Review Logs" 
          icon="star" 
          onPress={() => router.push('/reviews' as any)} 
          colors={colors} 
          typography={typography} 
        />

        <MenuRow 
          title="Performance Metrics" 
          icon="bar-chart" 
          onPress={() => router.push('/performance' as any)} 
          colors={colors} 
          typography={typography} 
        />

        <MenuRow 
          title="App Settings & Security" 
          icon="settings" 
          onPress={() => router.push('/settings' as any)} 
          colors={colors} 
          typography={typography} 
        />
      </View>

      {/* Logout button */}
      <Pressable style={[styles.logoutBtn, { backgroundColor: colors.text }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.surface} style={{ marginRight: 8 }} />
        <Text style={[typography.buttonText, { color: colors.surface }]}>Logout Account</Text>
      </Pressable>
    </ScrollView>
  );
}

function MenuRow({ title, icon, onPress, colors, typography }: { 
  title: string; 
  icon: string; 
  onPress: () => void; 
  colors: any; 
  typography: any 
}) {
  return (
    <Pressable style={[styles.menuRow, { borderTopColor: colors.border }]} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
      <Text style={[typography.bodyMedium, { color: colors.text, flex: 1, fontWeight: '600' }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactContainer: {
    paddingVertical: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    padding: 16,
    paddingBottom: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  logoutBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
});
