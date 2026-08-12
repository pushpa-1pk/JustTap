import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { logout, switchRole, updateUser } from '@/redux/slices/authSlice';
import { RootState } from '@/redux/store';
import { secureStore } from '@/utils/secureStore';
import { AppUserRole, getDefaultRouteForRole } from '@/utils/auth';
import { useTheme } from '@/hooks/useTheme';
import { useGetCustomerProfile, useBecomeProvider, useSwitchRole } from '@/hooks/useProfile';
import { queryClient } from '@/config/reactQuery';

export default function CustomerProfileScreen() {
  const { colors, typography, spacing } = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();

  const user = useSelector((state: RootState) => state.auth.user);
  const roles = user?.roles || ['CUSTOMER'];
  const currentRole = user?.role || 'CUSTOMER';

  const { data, isLoading, isError, refetch } = useGetCustomerProfile();
  const becomeProviderMutation = useBecomeProvider();
  const switchRoleMutation = useSwitchRole();

  const profile = data?.profile;
  const isComplete = profile?.profileCompletion === 100;
  const customerId = profile?.userId ? `ID: ${profile.userId.slice(-8).toUpperCase()}` : '';

  // Calculate member since
  const memberSince = profile
    ? new Date(profile.createdAt as any).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : 'August 2026';

  useEffect(() => {
    if (profile && profile.profileCompletion === 100 && !user?.isProfileComplete) {
      dispatch(updateUser({ isProfileComplete: true }));
    }
  }, [profile, user?.isProfileComplete, dispatch]);

  const handleBecomeProvider = async () => {
    Alert.alert(
      'Become a Provider',
      'Would you like to register as a service provider on JustTap?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const updatedUser = await becomeProviderMutation.mutateAsync();
              
              // Update redux state with new roles
              dispatch(updateUser({ roles: updatedUser.user.roles }));
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success!', "You are now upgraded to a provider! You can switch role below.");
              refetch();
            } catch (err) {
              console.error('Become provider failed:', err);
              Alert.alert('Error', 'Upgrade request failed. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSwitchRole = async (role: AppUserRole) => {
    if (!roles.includes(role)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await switchRoleMutation.mutateAsync(role);
      router.replace(getDefaultRouteForRole(role));
    } catch (err) {
      console.error('Role switch failed:', err);
      Alert.alert('Error', 'Failed to switch role. Please try again.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out of JustTap?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await secureStore.clearAll();
            queryClient.clear();
            dispatch(logout());
            router.replace('/(auth)/login');
          } catch (err) {
            console.error('Logout failed:', err);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      {/* Profile Header */}
      <View style={[styles.headerCard, { borderColor: colors.border }]}>
        <View style={styles.headerInfoRow}>
          {profile?.profileImage ? (
            <ExpoImage source={{ uri: profile.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="person" size={32} color={colors.textSecondary} />
            </View>
          )}

          <View style={styles.headerTextCol}>
            <View style={styles.nameRow}>
              <Text style={[styles.fullName, { color: colors.text }]}>
                {profile?.fullName || 'Verified Customer'}
              </Text>
              {isComplete && (
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginLeft: 4 }} />
              )}
            </View>

            {customerId ? (
              <Text style={[styles.customerId, { color: colors.textSecondary }]}>{customerId}</Text>
            ) : null}
            <Text style={[styles.contactInfo, { color: colors.textSecondary }]}>
              +91 {user?.phone}
            </Text>
            {profile?.email ? (
              <Text style={[styles.contactInfo, { color: colors.textSecondary }]}>
                {profile.email}
              </Text>
            ) : null}
            <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
              Member Since: {memberSince}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/edit-profile')}
          style={({ pressed }) => [
            styles.editBtn,
            { borderColor: colors.primary },
            pressed && { backgroundColor: colors.primary + '10' },
          ]}
        >
          <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* Quick Grid Actions */}
      <View style={styles.quickGrid}>
        <Pressable
          onPress={() => router.push('/bookings')}
          style={styles.quickTile}
        >
          <Ionicons name="briefcase" size={26} color={colors.primary} />
          <Text style={[styles.quickText, { color: colors.text }]}>My Bookings</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/wallet')}
          style={styles.quickTile}
        >
          <Ionicons name="wallet" size={26} color={colors.primary} />
          <Text style={[styles.quickText, { color: colors.text }]}>Wallet</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/support')}
          style={styles.quickTile}
        >
          <Ionicons name="help-circle" size={26} color={colors.primary} />
          <Text style={[styles.quickText, { color: colors.text }]}>Support</Text>
        </Pressable>
      </View>

      {/* Switch Role / Become Provider */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Platform</Text>
        
        {roles.includes('PROVIDER') ? (
          <View style={styles.switchRoleContainer}>
            <Text style={[styles.switchRoleLabel, { color: colors.textSecondary }]}>
              Switch platform workspace:
            </Text>
            <View style={styles.segmentRow}>
              {roles.map((role) => (
                <Pressable
                  key={role}
                  style={[
                    styles.segment,
                    { borderColor: colors.border },
                    currentRole === role && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => handleSwitchRole(role)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: currentRole === role ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {role}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <Pressable
            onPress={handleBecomeProvider}
            style={[styles.becomeProviderBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="construct-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.becomeProviderText}>Become a Provider</Text>
          </Pressable>
        )}
      </View>

      {/* Information Menu list */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Information</Text>
        <MenuRow
          title="Saved Addresses"
          icon="location-outline"
          onPress={() => router.push('/addresses')}
        />
        <MenuRow
          title="Payment Methods"
          icon="card-outline"
          onPress={() => router.push('/payment-methods')}
        />
        <MenuRow
          title="Coupons & Rewards"
          icon="pricetags-outline"
          onPress={() => router.push('/coupons')}
        />
        <MenuRow
          title="Refer & Earn"
          icon="people-outline"
          onPress={() => router.push('/referrals')}
        />
        <MenuRow
          title="My Reviews"
          icon="star-outline"
          onPress={() => router.push('/reviews')}
        />
      </View>

      {/* Account Settings Menu list */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        <MenuRow
          title="Settings"
          icon="settings-outline"
          onPress={() => router.push('/settings')}
        />
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [
          styles.logoutButton,
          { backgroundColor: colors.text },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

interface MenuRowProps {
  title: string;
  icon: string;
  onPress: () => void;
}

function MenuRow({ title, icon, onPress }: MenuRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        { borderTopColor: colors.border },
        pressed && { backgroundColor: '#F8FAFC' },
      ]}
    >
      <Ionicons name={icon as any} color={colors.text} size={20} />
      <Text style={[styles.menuText, { color: colors.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" color={colors.textSecondary} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullName: {
    fontSize: 20,
    fontWeight: '900',
  },
  customerId: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  contactInfo: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  memberSince: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  editBtn: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickTile: {
    flex: 1,
    height: 90,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  quickText: {
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    padding: 16,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  menuRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 12,
  },
  switchRoleContainer: {
    padding: 16,
    paddingTop: 0,
  },
  switchRoleLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '900',
  },
  becomeProviderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
  },
  becomeProviderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  logoutButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
