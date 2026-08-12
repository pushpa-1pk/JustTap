import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGetCustomerWallet, useGetCustomerTransactions, useAddCustomerFunds } from '@/hooks/useWallet';
import { useTheme } from '@/hooks/useTheme';

export default function WalletScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const { data: wallet, isLoading: isWalletLoading, refetch: refetchWallet } = useGetCustomerWallet();
  const { data: transactions, isLoading: isTxLoading, refetch: refetchTx } = useGetCustomerTransactions();
  const addFundsMutation = useAddCustomerFunds();

  const [topUpAmount, setTopUpAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleQuickAmount = (amount: number) => {
    setTopUpAmount(amount.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddFunds = async () => {
    const parsedAmount = parseFloat(topUpAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number to top up.');
      return;
    }

    setIsAdding(true);
    try {
      // API expects amount in paise (1 INR = 100 paise)
      const amountPaise = Math.round(parsedAmount * 100);
      await addFundsMutation.mutateAsync(amountPaise);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTopUpAmount('');
      refetchWallet();
      refetchTx();
      Alert.alert('Success', `Funded wallet with ₹${parsedAmount.toFixed(2)} successfully!`);
    } catch (err: any) {
      console.error('Wallet funding failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err?.message || 'Failed to add funds. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  if (isWalletLoading) {
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
        <Text style={[typography.h3, { color: colors.text }]}>My Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Wallet Card */}
      <View style={[styles.walletCard, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.walletCardLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.walletCardBalance}>{formatPrice(wallet?.balancePaise)}</Text>
        </View>
        <View style={styles.walletStatsRow}>
          <View style={styles.walletStatItem}>
            <Text style={styles.walletCardSubLabel}>REWARDS</Text>
            <Text style={styles.walletCardSubValue}>{wallet?.rewardPoints || 0} pts</Text>
          </View>
          <View style={styles.walletStatItem}>
            <Text style={styles.walletCardSubLabel}>CASHBACK</Text>
            <Text style={styles.walletCardSubValue}>{formatPrice(wallet?.cashbackPaise)}</Text>
          </View>
          <View style={styles.walletStatItem}>
            <Text style={styles.walletCardSubLabel}>REFERRALS</Text>
            <Text style={styles.walletCardSubValue}>{formatPrice(wallet?.referralBonusPaise)}</Text>
          </View>
        </View>
      </View>

      {/* Top up Input */}
      <View style={[styles.section, { backgroundColor: '#FFFFFF', borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Funds to Wallet</Text>
        <View style={styles.inputContainer}>
          <Text style={[styles.currencyPrefix, { color: colors.text }]}>₹</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={topUpAmount}
            onChangeText={setTopUpAmount}
          />
        </View>

        {/* Quick select amounts */}
        <View style={styles.quickSelectRow}>
          {[200, 500, 1000, 2000].map((amt) => (
            <Pressable
              key={amt}
              onPress={() => handleQuickAmount(amt)}
              style={[styles.quickAmountBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.quickAmountText, { color: colors.text }]}>+₹{amt}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleAddFunds}
          disabled={isAdding}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
            isAdding && { opacity: 0.5 },
          ]}
        >
          {isAdding ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.addBtnText}>Add Money</Text>
          )}
        </Pressable>
      </View>

      {/* Transactions Section */}
      <View style={styles.txSection}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
          Recent Transactions
        </Text>

        {isTxLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !transactions || transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 8 }]}>
              No transactions yet.
            </Text>
          </View>
        ) : (
          <View style={[styles.txList, { borderColor: colors.border }]}>
            {transactions.map((tx) => (
              <View key={tx._id} style={[styles.txRow, { borderBottomColor: colors.border }]}>
                <View style={styles.txIconContainer}>
                  <Ionicons
                    name={tx.type === 'CREDIT' ? 'arrow-down-circle' : 'arrow-up-circle'}
                    size={32}
                    color={tx.type === 'CREDIT' ? '#16A34A' : '#DC2626'}
                  />
                </View>
                <View style={styles.txDetails}>
                  <Text style={[styles.txDesc, { color: colors.text }]}>{tx.description}</Text>
                  <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                    {new Date(tx.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.txValueContainer}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: tx.type === 'CREDIT' ? '#16A34A' : '#DC2626' },
                    ]}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'}
                    {formatPrice(tx.amountPaise)}
                  </Text>
                  <Text style={[styles.txBalanceType, { color: colors.textSecondary }]}>
                    {tx.balanceType}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
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
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  walletCard: {
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    minHeight: 180,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  walletCardLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  walletCardBalance: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 4,
  },
  walletStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
    marginTop: 16,
    gap: 8,
  },
  walletStatItem: {
    flex: 1,
  },
  walletCardSubLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  walletCardSubValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#111111',
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 32,
    fontWeight: '900',
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: 60,
    fontSize: 32,
    fontWeight: '900',
    padding: 0,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickAmountBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  addBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  txSection: {
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  txList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  txIconContainer: {
    marginRight: 14,
  },
  txDetails: {
    flex: 1,
  },
  txDesc: {
    fontSize: 15,
    fontWeight: '800',
  },
  txDate: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  txValueContainer: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  txBalanceType: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
