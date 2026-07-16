import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useGetWalletQuery, useRequestWithdrawalMutation } from '@/redux/api/paymentApi';
import { useGetBankDetailsQuery } from '@/redux/api/profileApi';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function ProviderWalletScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const [withdrawAmount, setWithdrawAmount] = useState('');

  // API Queries & Mutations
  const { data: walletRes, isLoading: isWalletLoading, refetch: refetchWallet } = useGetWalletQuery();
  const { data: bankRes, isLoading: isBankLoading } = useGetBankDetailsQuery();
  const [requestWithdrawal, { isLoading: isRequesting }] = useRequestWithdrawalMutation();

  const wallet = walletRes?.data;
  const bank = bankRes?.data;

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
      await requestWithdrawal({
        amountPaise: amountVal * 100,
        bankDetails: {
          accountNumber: bank.accountNumber,
          ifscCode: bank.ifscCode,
          accountHolderName: bank.accountHolderName,
        }
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Payout Initiated', `Withdrawal request of ₹${amountVal} created successfully!`);
      setWithdrawAmount('');
      refetchWallet();
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      Alert.alert('Payout Error', err.data?.message || 'Failed to submit withdrawal request.');
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      
      {/* Wallet Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.secondary }]}>
        <Text style={[typography.caption, { color: '#FFFFFF', opacity: 0.8 }]}>CURRENT BALANCE</Text>
        <Text style={[typography.h1, { color: '#FFFFFF', fontWeight: '800', marginTop: 4, fontSize: 36 }]}>
          ₹{balance.toLocaleString()}
        </Text>
        
        <View style={styles.cardRow}>
          <View>
            <Text style={[typography.caption, { color: '#FFFFFF', opacity: 0.6 }]}>TOTAL WITHDRAWN</Text>
            <Text style={[typography.bodyLarge, { color: '#FFFFFF', fontWeight: '700', marginTop: 2 }]}>
              ₹{withdrawn.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Linked Bank Section */}
      <Text style={[styles.sectionTitle, typography.h3, { color: colors.text }]}>Payout Destination</Text>
      {bank ? (
        <View style={[styles.bankCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.bankHeader}>
            <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
              🏦 {bank.bankName}
            </Text>
            <Pressable onPress={() => router.push('/(provider)/bank-setup')}>
              <Text style={[typography.caption, { color: colors.secondary, fontWeight: '700' }]}>EDIT</Text>
            </Pressable>
          </View>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
            Acc Holder: {bank.accountHolderName}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            A/C: **** **** {bank.accountNumber.substring(bank.accountNumber.length - 4)} • IFSC: {bank.ifscCode}
          </Text>
        </View>
      ) : (
        <Pressable 
          style={[styles.bankCard, { backgroundColor: colors.surface, borderColor: colors.border, borderStyle: 'dashed' }]}
          onPress={() => router.push('/(provider)/bank-setup')}
        >
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>
            + Link Bank Account for Payouts
          </Text>
        </Pressable>
      )}

      {/* Withdrawal Input Form */}
      <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.lg }]}>
        Withdraw Funds
      </Text>
      <View style={[styles.withdrawForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary }]}>WITHDRAWAL AMOUNT (₹)</Text>
        <TextInput
          style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
          placeholder="e.g. 1000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
        />

        <Pressable
          style={[styles.withdrawBtn, { backgroundColor: colors.secondary, marginTop: spacing.md }]}
          onPress={handleWithdrawSubmit}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Request Bank Payout</Text>
          )}
        </Pressable>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  bankCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  withdrawForm: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  label: {
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  withdrawBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
