import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Clipboard,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGetReferralInfo } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';

export default function ReferralsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const { data: refInfo, isLoading } = useGetReferralInfo();

  const handleCopyCode = () => {
    if (!refInfo?.referralCode) return;
    Clipboard.setString(refInfo.referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
  };

  const handleInvite = async () => {
    if (!refInfo?.referralCode) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: `Join JustTap using my referral code: ${refInfo.referralCode} and get flat ₹100 off on your first booking! Download now.`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const formatPrice = (paise: number = 0) => {
    return `₹${(paise / 100).toFixed(0)}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView style={[styles.container]} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>Refer & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Banner Card */}
      <View style={[styles.bannerCard, { backgroundColor: colors.primary }]}>
        <Ionicons name="gift" size={54} color="#FFFFFF" />
        <Text style={styles.bannerTitle}>Invite Friends & Family</Text>
        <Text style={styles.bannerSub}>
          Share your referral code and earn ₹50 for every friend who completes their first service booking. Your friend gets ₹100 too!
        </Text>
      </View>

      {/* Code Card */}
      <View style={[styles.card, { borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>YOUR REFERRAL CODE</Text>
        <View style={[styles.codeRow, { backgroundColor: '#F1F5F9' }]}>
          <Text style={[styles.codeText, { color: colors.primary }]}>{refInfo?.referralCode}</Text>
          <Pressable onPress={handleCopyCode} style={styles.copyBtn}>
            <Ionicons name="copy-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable
          onPress={handleInvite}
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.shareText}>Invite Friends</Text>
        </Pressable>
      </View>

      {/* Earnings Summary */}
      <View style={styles.row}>
        <View style={[styles.halfCard, { borderColor: colors.border }]}>
          <Text style={[styles.halfCardTitle, { color: colors.textSecondary }]}>TOTAL EARNINGS</Text>
          <Text style={[styles.halfCardValue, { color: '#16A34A' }]}>
            {formatPrice(refInfo?.referralEarningsPaise)}
          </Text>
        </View>
        <View style={[styles.halfCard, { borderColor: colors.border }]}>
          <Text style={[styles.halfCardTitle, { color: colors.textSecondary }]}>SUCCESSFUL REFERS</Text>
          <Text style={[styles.halfCardValue, { color: colors.text }]}>
            {refInfo?.referralHistory.filter(h => h.status === 'COMPLETED').length || 0}
          </Text>
        </View>
      </View>

      {/* Referral History */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Referral History</Text>

      {!refInfo?.referralHistory || refInfo.referralHistory.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No referral history found yet.
        </Text>
      ) : (
        <View style={[styles.historyList, { borderColor: colors.border }]}>
          {refInfo.referralHistory.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.historyRow,
                { borderBottomColor: colors.border },
                idx === refInfo.referralHistory.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.historyLeft}>
                <Text style={[styles.friendName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.referDate, { color: colors.textSecondary }]}>
                  Referred on {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.historyRight}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        item.status === 'COMPLETED' ? '#16A34A15' : '#FBC02D15',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.status === 'COMPLETED' ? '#16A34A' : '#D97706' },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
                {item.rewardPaise > 0 && (
                  <Text style={[styles.rewardText, { color: '#16A34A' }]}>
                    +{formatPrice(item.rewardPaise)}
                  </Text>
                )}
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
  bannerCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
  },
  bannerSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  copyBtn: {
    padding: 4,
  },
  shareBtn: {
    height: 48,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  halfCardTitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  halfCardValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  historyList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  historyLeft: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '800',
  },
  referDate: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
