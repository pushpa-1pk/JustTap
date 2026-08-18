import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface BalanceSummaryProps {
  availableBalance: number;
  pendingBalance: number;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  availableBalance,
  pendingBalance,
}) => {
  const { colors, typography } = useTheme();

  const formatCurrency = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  return (
    <View style={styles.container}>
      {/* Available Balance Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.caption, styles.label, { color: colors.textSecondary }]}>
          Available to Withdraw
        </Text>
        <Text style={[typography.h2, styles.amount, { color: colors.text }]}>
          {formatCurrency(availableBalance)}
        </Text>
      </View>

      {/* Pending Balance Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.caption, styles.label, { color: colors.textSecondary }]}>
          Pending Balance
        </Text>
        <Text style={[typography.h2, styles.amount, { color: colors.textSecondary }]}>
          {formatCurrency(pendingBalance)}
        </Text>
        <Text style={[styles.subText, { color: colors.textSecondary }]}>
          Processing
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  label: {
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  amount: {
    fontWeight: '900',
    fontSize: 22,
    marginTop: 6,
    lineHeight: 28,
  },
  subText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
export default BalanceSummary;
