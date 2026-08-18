import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Keyboard, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';


interface WithdrawalSheetProps {
  visible: boolean;
  onClose: () => void;
  availableBalance: number;
  minWithdrawal: number;
  maxWithdrawal: number | null;
  withdrawalStatus: 'idle' | 'submitting' | 'success' | 'failed';
  errorMessage: string | null;
  onSubmit: (amount: number, idempotencyKey: string) => void;
}

export const WithdrawalSheet: React.FC<WithdrawalSheetProps> = ({
  visible,
  onClose,
  availableBalance,
  minWithdrawal,
  maxWithdrawal,
  withdrawalStatus,
  errorMessage,
  onSubmit,
}) => {
  const { colors, typography } = useTheme();
  const [amountStr, setAmountStr] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Section 37: Generate a new idempotencyKey exactly once when the sheet opens
  useEffect(() => {
    if (visible) {
      setIdempotencyKey('idem-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
      setAmountStr('');
      setValidationError(null);
    }
  }, [visible]);

  // Clean validation errors on amount change
  const handleAmountChange = (text: string) => {
    // Sanitization: only allow integers
    const sanitized = text.replace(/[^0-9]/g, '');
    setAmountStr(sanitized);
    setValidationError(null);

    // Section 37: If changing the amount after a failed attempt, generate a new idempotency key
    if (withdrawalStatus === 'failed') {
      setIdempotencyKey('idem-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    }
  };

  const handleWithdraw = () => {
    Keyboard.dismiss();
    const amount = parseInt(amountStr, 10);

    if (isNaN(amount) || amount <= 0) {
      setValidationError('Enter a valid withdrawal amount.');
      return;
    }

    if (amount > availableBalance) {
      setValidationError('Insufficient balance.');
      return;
    }

    if (amount < minWithdrawal) {
      setValidationError(`Minimum withdrawal amount is ₹${minWithdrawal}.`);
      return;
    }

    if (maxWithdrawal && amount > maxWithdrawal) {
      setValidationError(`Maximum withdrawal amount is ₹${maxWithdrawal}.`);
      return;
    }

    if (!idempotencyKey) return;
    onSubmit(amount, idempotencyKey);
  };

  const formatCurrency = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const isSubmitting = withdrawalStatus === 'submitting';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.flexPressable} onPress={isSubmitting ? undefined : onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[typography.h3, styles.title, { color: colors.text }]}>
              Withdraw Money
            </Text>
            {!isSubmitting && (
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            )}
          </View>

          {withdrawalStatus === 'success' ? (
            <View style={styles.successBlock}>
              <View style={[styles.successIconBg, { backgroundColor: colors.secondary + '15' }]}>
                <Ionicons name="checkmark-circle" size={48} color={colors.secondary} />
              </View>
              <Text style={[typography.h2, styles.successTitle, { color: colors.text }]}>
                Withdrawal requested
              </Text>
              <Text style={[typography.h1, styles.successAmount, { color: colors.secondary }]}>
                {formatCurrency(parseInt(amountStr, 10) || 0)}
              </Text>
              <Text style={[typography.bodyMedium, styles.successDesc, { color: colors.textSecondary }]}>
                Your payout request is being processed. Funds will be credited to your registered bank account.
              </Text>

              <Pressable
                onPress={onClose}
                style={[styles.btnPrimary, { backgroundColor: colors.secondary, width: '100%', marginTop: 12 }]}
              >
                <Text style={styles.btnText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.body}>
              <View style={styles.balanceInfo}>
                <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '800' }]}>
                  AVAILABLE BALANCE
                </Text>
                <Text style={[typography.h3, { color: colors.text, fontWeight: '800' }]}>
                  {formatCurrency(availableBalance)}
                </Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={[typography.bodyLarge, styles.inputLabel, { color: colors.text }]}>
                  Amount (₹)
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.currencySymbol, { color: colors.text }]}>₹</Text>
                  <TextInput
                    value={amountStr}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    style={[styles.input, { color: colors.text }]}
                    editable={!isSubmitting}
                  />
                </View>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, fontWeight: '600' }]}>
                  Minimum withdrawal: ₹{minWithdrawal}
                </Text>
              </View>

              {/* Error messages */}
              {(validationError || errorMessage) && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[typography.bodySmall, { color: colors.danger, fontWeight: '700' }]}>
                    {validationError || errorMessage}
                  </Text>
                </View>
              )}

              {/* Footer Actions */}
              <View style={styles.footer}>
                <Pressable
                  disabled={isSubmitting}
                  onPress={onClose}
                  style={[styles.btnSecondary, { borderColor: colors.border }]}
                >
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary, fontWeight: '700' }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  disabled={isSubmitting || amountStr.length === 0}
                  onPress={handleWithdraw}
                  style={({ pressed }) => [
                    styles.btnPrimary,
                    { backgroundColor: colors.secondary },
                    (isSubmitting || amountStr.length === 0) && { backgroundColor: '#E2E8F0' },
                    pressed && { opacity: 0.9 }
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[styles.btnText, (isSubmitting || amountStr.length === 0) && { color: colors.textSecondary }]}>
                      Withdraw
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  flexPressable: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.select({ ios: 34, android: 20 }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
    gap: 20,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontWeight: '800',
  },
  inputWrapper: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '800',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    paddingVertical: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  btnPrimary: {
    flex: 1.5,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondary: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  successBlock: {
    padding: 32,
    alignItems: 'center',
  },
  successIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  successAmount: {
    fontWeight: '900',
    fontSize: 32,
    marginBottom: 16,
  },
  successDesc: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});
export default WithdrawalSheet;
