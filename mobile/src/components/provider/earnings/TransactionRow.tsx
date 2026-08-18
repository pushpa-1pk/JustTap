import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { EarningsTransaction } from '../../../types/earnings';
import { PayoutStatusBadge } from './PayoutStatusBadge';
import { useTheme } from '../../../hooks/useTheme';

interface TransactionRowProps {
  transaction: EarningsTransaction;
  onPress: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onPress,
}) => {
  const { colors, typography } = useTheme();

  const formatCurrency = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const isCredit = transaction.direction === 'CREDIT';
  const prefix = isCredit ? '+' : '-';
  const priceColor = isCredit ? colors.secondary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { borderBottomColor: colors.border },
        pressed && { opacity: 0.8 },
      ]}
      accessibilityLabel={`Transaction: ${transaction.serviceName}, amount: ${prefix}${formatCurrency(transaction.amount)}`}
      accessibilityRole="button"
    >
      <View style={styles.leftCol}>
        <Text style={[typography.bodyMedium, styles.title, { color: colors.text }]} numberOfLines={1}>
          {transaction.serviceName}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {formatDate(transaction.createdAt)} • {transaction.type.replace(/_/g, ' ')}
        </Text>
      </View>

      <View style={styles.rightCol}>
        <Text style={[typography.bodyLarge, styles.amount, { color: priceColor }]}>
          {prefix}{formatCurrency(transaction.amount)}
        </Text>
        <View style={styles.badgeWrapper}>
          <PayoutStatusBadge status={transaction.status} />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 72, // 48dp minimum target easily met
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  leftCol: {
    flex: 1.5,
    paddingRight: 12,
  },
  title: {
    fontWeight: '800',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontWeight: '900',
  },
  badgeWrapper: {
    marginTop: 2,
  },
});
export default TransactionRow;
