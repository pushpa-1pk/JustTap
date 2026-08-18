import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentStatus } from '../../../types/job';
import { useTheme } from '../../../hooks/useTheme';

interface PaymentStatusIndicatorProps {
  paymentStatus: PaymentStatus;
}

export const PaymentStatusIndicator: React.FC<PaymentStatusIndicatorProps> = ({
  paymentStatus,
}) => {
  const { colors, typography } = useTheme();

  // Mapped indicator driven by paymentStatus (Section 26)
  const getIndicatorConfig = () => {
    switch (paymentStatus) {
      case 'COMPLETED':
        return {
          label: 'Payment\n✓ Received',
          color: colors.secondary,
        };
      case 'PENDING':
        return {
          label: 'Payment\n⏳ Pending',
          color: colors.warning,
        };
      case 'FAILED':
        return {
          label: 'Payment\n✕ Failed',
          color: colors.danger,
        };
      case 'REFUNDED':
        return {
          label: 'Payment\n↶ Refunded',
          color: colors.textSecondary,
        };
      default:
        return {
          label: `Payment\n${String(paymentStatus)}`,
          color: colors.textSecondary,
        };
    }
  };

  const config = getIndicatorConfig();

  return (
    <View style={styles.container}>
      <Text style={[typography.caption, styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  label: {
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'right',
  },
});
export default PaymentStatusIndicator;
