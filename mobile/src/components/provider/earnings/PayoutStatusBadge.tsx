import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface PayoutStatusBadgeProps {
  status: string;
}

export const PayoutStatusBadge: React.FC<PayoutStatusBadgeProps> = ({ status }) => {
  const { colors, typography } = useTheme();

  const getBadgeConfig = () => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'SETTLED':
      case 'SUCCESS':
        return {
          text: 'COMPLETED',
          bg: '#EAFDF0',
          color: colors.secondary,
          icon: 'checkmark-circle-outline' as const,
        };
      case 'PENDING':
        return {
          text: 'PENDING',
          bg: '#FFFBEB',
          color: colors.warning,
          icon: 'time-outline' as const,
        };
      case 'PROCESSING':
        return {
          text: 'PROCESSING',
          bg: '#EFF6FF',
          color: '#2563EB',
          icon: 'sync-outline' as const,
        };
      case 'FAILED':
        return {
          text: 'FAILED',
          bg: '#FEF2F2',
          color: colors.danger,
          icon: 'close-circle-outline' as const,
        };
      default:
        return {
          text: status.toUpperCase(),
          bg: colors.surfaceVariant,
          color: colors.textSecondary,
          icon: 'alert-circle-outline' as const,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={11} color={config.color} />
      <Text style={[typography.caption, styles.text, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  text: {
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
export default PayoutStatusBadge;
