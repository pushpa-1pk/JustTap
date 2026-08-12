import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface WithdrawalBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  availableBalance: number; // in Rupees
  payoutMethodName: string; // e.g. "HDFC Bank"
  payoutMethodMasked: string; // e.g. "•••• 5678"
  onConfirmWithdraw: (amountRupees: number) => Promise<any>;
}

export default function WithdrawalBottomSheet({
  visible,
  onClose,
  availableBalance,
  payoutMethodName,
  payoutMethodMasked,
  onConfirmWithdraw,
}: WithdrawalBottomSheetProps) {
  const { typography } = useTheme();

  const [amountStr, setAmountStr] = useState('');
  const [withdrawState, setWithdrawState] = useState<'idle' | 'confirming' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state on open
  useEffect(() => {
    if (visible) {
      setAmountStr('');
      setWithdrawState('idle');
      setErrorMessage('');
    }
  }, [visible]);

  const handlePercentageSelect = (pct: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = Math.floor(availableBalance * pct);
    setAmountStr(target > 0 ? target.toString() : '');
  };

  const handleConfirm = async () => {
    const value = parseFloat(amountStr);
    if (isNaN(value) || value <= 0) {
      setErrorMessage('Please type a valid amount.');
      return;
    }
    if (value < 500) {
      setErrorMessage('Minimum withdrawal amount is ₹500.');
      return;
    }
    if (value > availableBalance) {
      setErrorMessage('Insufficient balance.');
      return;
    }

    setErrorMessage('');
    setWithdrawState('confirming');
  };

  const handleExecuteWithdrawal = async () => {
    const value = parseFloat(amountStr);
    setWithdrawState('processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await onConfirmWithdraw(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWithdrawState('success');
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(err.response?.data?.message || 'Failed to request payout settlement.');
      setWithdrawState('failed');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          
          {/* Close Header */}
          {withdrawState !== 'processing' && withdrawState !== 'success' && (
            <View style={styles.header}>
              <Text style={[typography.h3, { color: '#0F172A', fontWeight: '800' }]}>Withdraw Funds</Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </Pressable>
            </View>
          )}

          {/* STATE: IDLE / FORM FILL */}
          {withdrawState === 'idle' && (
            <View style={styles.body}>
              <Text style={[typography.bodyMedium, { color: '#64748B' }]}>Available Balance</Text>
              <Text style={[typography.h1, { color: '#16A34A', fontWeight: '900', marginTop: 4, fontSize: 32 }]}>
                ₹{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>

              {/* Amount input */}
              <View style={styles.inputContainer}>
                <Text style={[typography.h1, { color: '#0F172A', fontWeight: '700', marginRight: 4 }]}>₹</Text>
                <TextInput
                  style={[styles.input, typography.h2]}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amountStr}
                  onChangeText={(val) => {
                    setAmountStr(val);
                    setErrorMessage('');
                  }}
                  autoFocus
                />
              </View>

              {/* Percentage pills */}
              <View style={styles.percentageRow}>
                <Pressable onPress={() => handlePercentageSelect(0.25)} style={styles.pill}><Text style={typography.caption}>25%</Text></Pressable>
                <Pressable onPress={() => handlePercentageSelect(0.50)} style={styles.pill}><Text style={typography.caption}>50%</Text></Pressable>
                <Pressable onPress={() => handlePercentageSelect(0.75)} style={styles.pill}><Text style={typography.caption}>75%</Text></Pressable>
                <Pressable onPress={() => handlePercentageSelect(1.0)} style={styles.pill}><Text style={[typography.caption, { fontWeight: '700', color: '#16A34A' }]}>MAX</Text></Pressable>
              </View>

              {/* Error logs */}
              {errorMessage !== '' && (
                <Text style={[typography.bodySmall, { color: '#EF4444', fontWeight: '700', marginTop: 12 }]}>{errorMessage}</Text>
              )}

              {/* Payout method summary */}
              <View style={styles.payoutCard}>
                <Ionicons name="business" size={20} color="#16A34A" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700' }]}>{payoutMethodName}</Text>
                  <Text style={[typography.caption, { color: '#64748B', marginTop: 2 }]}>{payoutMethodMasked} • Verified ✓</Text>
                </View>
              </View>

              <Pressable onPress={handleConfirm} style={[styles.btn, { backgroundColor: '#16A34A', marginTop: 20 }]}>
                <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Withdraw Funds</Text>
              </Pressable>
            </View>
          )}

          {/* STATE: CONFIRMING DETAILS */}
          {withdrawState === 'confirming' && (
            <View style={styles.body}>
              <Text style={[typography.h3, { color: '#0F172A', fontWeight: '800', textAlign: 'center', marginBottom: 16 }]}>
                Confirm Payout Request
              </Text>

              <View style={styles.confirmRow}>
                <Text style={[typography.bodyMedium, { color: '#64748B' }]}>Payout Amount</Text>
                <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '800' }]}>₹{parseFloat(amountStr).toLocaleString()}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[typography.bodyMedium, { color: '#64748B' }]}>Deduction Fee</Text>
                <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '700' }]}>₹0 (Free)</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[typography.bodyMedium, { color: '#64748B' }]}>Expected Arrival</Text>
                <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700' }]}>Within 24 Hours</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[typography.bodyMedium, { color: '#64748B' }]}>Method</Text>
                <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700' }]}>{payoutMethodName} ({payoutMethodMasked.slice(-4)})</Text>
              </View>

              <View style={styles.actionsRow}>
                <Pressable onPress={() => setWithdrawState('idle')} style={[styles.cardBtn, { borderColor: '#E5E7EB', borderWidth: 1.5 }]}>
                  <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700' }]}>Back</Text>
                </Pressable>
                <Pressable onPress={handleExecuteWithdrawal} style={[styles.cardBtn, { backgroundColor: '#16A34A' }]}>
                  <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Confirm & Request</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STATE: PROCESSING MUTATION */}
          {withdrawState === 'processing' && (
            <View style={[styles.body, styles.center]}>
              <ActivityIndicator size="large" color="#16A34A" />
              <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700', marginTop: 16 }]}>
                Processing Payout Request...
              </Text>
              <Text style={[typography.caption, { color: '#64748B', marginTop: 6 }]}>
                Securing transactional ledger handshakes.
              </Text>
            </View>
          )}

          {/* STATE: SUCCESS SCREEN */}
          {withdrawState === 'success' && (
            <View style={[styles.body, styles.center]}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
              </View>
              <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800', marginTop: 16 }]}>
                Request Initiated Successfully!
              </Text>
              <Text style={[typography.bodyMedium, { color: '#64748B', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }]}>
                We have processed your withdrawal of ₹{parseFloat(amountStr).toLocaleString()} to your payout method. It will settle in 24 hours.
              </Text>
              <Pressable onPress={onClose} style={[styles.btn, { backgroundColor: '#16A34A', marginTop: 24, width: '100%' }]}>
                <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Done</Text>
              </Pressable>
            </View>
          )}

          {/* STATE: FAILED SCREEN */}
          {withdrawState === 'failed' && (
            <View style={[styles.body, styles.center]}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text style={[typography.h3, { color: '#0F172A', fontWeight: '800', marginTop: 16 }]}>
                Withdrawal Failed
              </Text>
              <Text style={[typography.bodyMedium, { color: '#64748B', textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }]}>
                {errorMessage || 'There was an issue processing your payout settlement.'}
              </Text>
              <View style={styles.actionsRow}>
                <Pressable onPress={() => setWithdrawState('idle')} style={[styles.cardBtn, { borderColor: '#E5E7EB', borderWidth: 1.5 }]}>
                  <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700' }]}>Edit Amount</Text>
                </Pressable>
                <Pressable onPress={onClose} style={[styles.cardBtn, { backgroundColor: '#EF4444' }]}>
                  <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>Close</Text>
                </Pressable>
              </View>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  body: {
    width: '100%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    marginTop: 16,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontWeight: '800',
  },
  percentageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
  },
  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  btn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cardBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16A34A15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
