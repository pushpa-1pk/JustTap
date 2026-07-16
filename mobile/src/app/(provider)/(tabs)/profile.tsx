import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { secureStore } from '@/utils/secureStore';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useGetProviderProfileQuery } from '@/redux/api/profileApi';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function ProviderProfileScreen() {
  const { colors, typography, spacing } = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();

  // Fetch profile for displaying details
  const { data: profileRes } = useGetProviderProfileQuery();
  const provider = profileRes?.data;

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await secureStore.clearAll();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  const menuItems = [
    { title: 'My Wallet & Payouts', icon: 'briefcase', path: '../wallet' as const, desc: 'View earnings balance and request cash-outs' },
    { title: 'Configure Payout Bank', icon: 'briefcase', path: '../bank-setup' as const, desc: 'Manage your primary bank transfer details' },
    { title: 'KYC Verification', icon: 'briefcase', path: '../kyc-upload' as const, desc: 'Manage identity verification documents' },
    { title: 'Alert Inbox', icon: 'briefcase', path: '../notifications' as const, desc: 'Review your in-app booking notifications' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      {/* Profile Header */}
      <View style={[styles.profileHeader, { borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary + '20' }]}>
          <Text style={[typography.h1, { color: colors.secondary, fontSize: 32 }]}>
            {provider?.businessName?.charAt(0).toUpperCase() || 'P'}
          </Text>
        </View>
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.md }]}>
          {provider?.businessName || 'Service Provider'}
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]}>
          ★ 4.9 • {provider?.experience || 5} Years Experience
        </Text>
      </View>

      {/* Menu List */}
      <View style={styles.menuSection}>
        {menuItems.map((item, idx) => (
          <Pressable
            key={idx}
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(item.path);
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
              <SvgIcon name={item.icon} color={colors.secondary} size={22} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{item.title}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{item.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable 
        style={[styles.logoutButton, { backgroundColor: colors.danger }]}
        onPress={handleLogout}
      >
        <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Log Out Business Account</Text>
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
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuSection: {
    gap: 12,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
