import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGetAvailableCoupons, useGetCustomerWallet } from '@/hooks/useWallet';
import { useTheme } from '@/hooks/useTheme';

export default function CouponsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const { data: coupons = [], isLoading: isCouponsLoading } = useGetAvailableCoupons();
  const { data: wallet, isLoading: isWalletLoading } = useGetCustomerWallet();

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', `Coupon code "${code}" has been copied to your clipboard.`);
  };

  if (isCouponsLoading || isWalletLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const formatPrice = (paise: number = 0) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView style={[styles.container]} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>Coupons & Rewards</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Rewards Overview card */}
      <View style={[styles.rewardsCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.rewardsCardTitle}>Your Rewards Hub</Text>
        <View style={styles.rewardsRow}>
          <View style={styles.rewardItem}>
            <Ionicons name="gift-outline" size={24} color="#FFFFFF" />
            <Text style={styles.rewardVal}>{wallet?.rewardPoints || 0}</Text>
            <Text style={styles.rewardLbl}>Reward Points</Text>
          </View>
          <View style={styles.rewardItem}>
            <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
            <Text style={styles.rewardVal}>{formatPrice(wallet?.cashbackPaise)}</Text>
            <Text style={styles.rewardLbl}>Cashback Saved</Text>
          </View>
          <View style={styles.rewardItem}>
            <Ionicons name="people-outline" size={24} color="#FFFFFF" />
            <Text style={styles.rewardVal}>{formatPrice(wallet?.referralBonusPaise)}</Text>
            <Text style={styles.rewardLbl}>Referral Bonus</Text>
          </View>
        </View>
      </View>

      {/* Coupons Section */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Coupons</Text>

      {coupons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetags-outline" size={48} color={colors.textSecondary} />
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 8 }]}>
            No coupons available at the moment.
          </Text>
        </View>
      ) : (
        <View style={styles.couponsList}>
          {coupons.map((coupon) => (
            <View key={coupon._id} style={[styles.couponCard, { borderColor: colors.border }]}>
              <View style={styles.couponLeft}>
                <View style={[styles.couponIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="pricetag" size={22} color={colors.primary} />
                </View>
                <View style={styles.couponInfo}>
                  <Text style={[styles.couponTitle, { color: colors.text }]}>
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}% OFF`
                      : `₹${(coupon.discountValue / 100).toFixed(0)} OFF`}
                  </Text>
                  <Text style={[styles.couponDesc, { color: colors.textSecondary }]}>
                    {coupon.description}
                  </Text>
                  <Text style={[styles.couponExpiry, { color: colors.textSecondary }]}>
                    Valid till: {new Date(coupon.expiryDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.couponRight}>
                <Pressable
                  onPress={() => handleCopyCode(coupon.code)}
                  style={[styles.codeBadge, { backgroundColor: '#F1F5F9' }]}
                >
                  <Text style={[styles.codeText, { color: colors.primary }]}>{coupon.code}</Text>
                  <Ionicons name="copy-outline" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: { padding: 4 },
  rewardsCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  rewardsCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  rewardLbl: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  couponsList: {
    gap: 16,
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  couponIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  couponInfo: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  couponDesc: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 16,
  },
  couponExpiry: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  couponRight: {
    alignItems: 'flex-end',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
