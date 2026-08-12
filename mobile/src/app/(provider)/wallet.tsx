import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, Alert, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useGetProviderWallet, useGetProviderBankDetails, useRequestProviderWithdrawal } from '@/hooks/useProviderProfile';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ProviderWalletScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const [withdrawAmount, setWithdrawAmount] = useState('');

  // API Queries & Mutations
  const { data: wallet, isLoading: isWalletLoading, isRefetching, refetch } = useGetProviderWallet();
  const { data: bank, isLoading: isBankLoading } = useGetProviderBankDetails();
  const requestWithdrawal = useRequestProviderWithdrawal();

  const handleWithdrawSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const amountVal = Number(withdrawAmount);
    
    if (isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }

    const balanceRupees = (wallet?.balancePaise || 0) / 100;
    if (amountVal > balanceRupees) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your current wallet balance.');
      return;
    }

    if (!bank) {
      Alert.alert('Link Bank Account', 'Please configure your payout bank account before withdrawing.', [
        { text: 'Set Up Bank', onPress: () => router.push('/(provider)/bank-setup') },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }

    try {
      await requestWithdrawal.mutateAsync({
        amountPaise: amountVal * 100,
        bankDetails: {
          accountNumber: bank.accountNumberMasked || '•••• 9876', // simulated placeholder
          ifscCode: bank.ifscCode,
          accountHolderName: bank.accountHolderName,
        }
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Payout Initiated', `Withdrawal request of ₹${amountVal} created successfully!`);
      setWithdrawAmount('');
      refetch();
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      Alert.alert('Payout Error', err.response?.data?.message || 'Failed to submit withdrawal request.');
    }
  };

  if (isWalletLoading || isBankLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  const balance = (wallet?.balancePaise || 0) / 100;
  const withdrawn = (wallet?.withdrawnPaise || 0) / 100;
  const pending = (wallet?.pendingSettlementPaise || 0) / 100;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.secondary} />
      }
    >
      
      {/* Wallet Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.secondary }]}>
        <Text style={[typography.caption, { color: '#FFFFFF', opacity: 0.8 }]}>CURRENT BALANCE</Text>
        <Text style={[typography.h1, { color: '#FFFFFF', fontWeight: '800', marginTop: 4, fontSize: 36 }]}>
          ₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
        
        <View style={styles.cardRow}>
          <View style={styles.col}>
            <Text style={styles.cardSubLabel}>PENDING SETTLEMENT</Text>
            <Text style={styles.cardSubVal}>₹{pending.toLocaleString()}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.cardSubLabel}>TOTAL WITHDRAWN</Text>
            <Text style={styles.cardSubVal}>₹{withdrawn.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Payout Bank Account linked indicator */}
      <View style={[styles.bankIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="card" size={24} color={colors.textSecondary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
            {bank ? bank.bankName : 'No Bank Connected'}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {bank ? `Account: ${bank.accountNumberMasked || '•••• 9876'} | IFSC: ${bank.ifscCode}` : 'Link bank account to receive withdrawals.'}
          </Text>
        </View>
        <Pressable 
          style={[styles.editBankBtn, { borderColor: colors.secondary }]}
          onPress={() => router.push('/(provider)/bank-setup')}
        >
          <Text style={[typography.caption, { color: colors.secondary, fontWeight: '700' }]}>
            {bank ? 'Edit' : 'Setup'}
          </Text>
        </Pressable>
      </View>

      {/* Withdraw section */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Request Payout</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
          Transfer money from your wallet ledger into your connected bank account.
        </Text>

        <View style={[styles.amountInputRow, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
          <Text style={[typography.h3, { color: colors.textSecondary, marginRight: 6 }]}>₹</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Pressable 
          style={[styles.payoutBtn, { backgroundColor: colors.secondary }]}
          onPress={handleWithdrawSubmit}
          disabled={requestWithdrawal.isPending}
        >
          {requestWithdrawal.isPending ? (
            <ActivityIndicator color={colors.onSecondary} />
          ) : (
            <Text style={[typography.buttonText, { color: colors.onSecondary, fontWeight: '800' }]}>
              Withdraw Funds to Bank
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 14,
  },
  col: { flex: 1 },
  cardSubLabel: {
    fontSize: 9,
    color: '#FFFFFF',
    opacity: 0.7,
    fontWeight: '700',
  },
  cardSubVal: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 2,
  },
  bankIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  editBankBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  payoutBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
