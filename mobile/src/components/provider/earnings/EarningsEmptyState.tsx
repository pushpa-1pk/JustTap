import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface EarningsEmptyStateProps {
  type: 'NO_EARNINGS' | 'NO_TRANSACTIONS' | 'NO_PERIOD_DATA';
}

export const EarningsEmptyState: React.FC<EarningsEmptyStateProps> = ({ type }) => {
  const { colors, typography } = useTheme();

  const getConfig = () => {
    switch (type) {
      case 'NO_EARNINGS':
        return {
          icon: 'wallet-outline' as const,
          title: 'No earnings yet',
          desc: 'Complete your first job to start earning on JustTap.',
        };
      case 'NO_TRANSACTIONS':
        return {
          icon: 'document-text-outline' as const,
          title: 'No transactions yet',
          desc: 'Your earnings activity will appear here.',
        };
      case 'NO_PERIOD_DATA':
        return {
          icon: 'calendar-outline' as const,
          title: 'No earnings for this period',
          desc: 'Try another date range.',
        };
    }
  };

  const config = getConfig();

  return (
    <View style={styles.container}>
      <View style={[styles.iconBg, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name={config.icon} size={36} color={colors.textSecondary} />
      </View>
      <Text style={[typography.h3, styles.title, { color: colors.text }]}>
        {config.title}
      </Text>
      <Text style={[typography.bodyMedium, styles.desc, { color: colors.textSecondary }]}>
        {config.desc}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
export default EarningsEmptyState;
