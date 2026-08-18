import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface EarningsHeroProps {
  periodLabel: string;
  totalAmount: number;
  comparison?: {
    percentage: number;
    direction: 'UP' | 'DOWN';
  };
  updatedAt: string;
}

export const EarningsHero: React.FC<EarningsHeroProps> = ({
  periodLabel,
  totalAmount,
  comparison,
  updatedAt,
}) => {
  const { colors, typography } = useTheme();
  const [timeAgo, setTimeAgo] = useState('Updated just now');

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!updatedAt) {
        setTimeAgo('Updated just now');
        return;
      }

      const diffMs = Date.now() - new Date(updatedAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) {
        setTimeAgo('Updated just now');
      } else if (diffMins === 1) {
        setTimeAgo('Updated 1 min ago');
      } else {
        setTimeAgo(`Updated ${diffMins} min ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [updatedAt]);

  const formatCurrency = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const renderComparison = () => {
    if (!comparison || comparison.percentage === 0) {
      return (
        <Text style={[typography.bodySmall, { color: colors.textSecondary, fontWeight: '700' }]}>
          No comparison available
        </Text>
      );
    }

    const isUp = comparison.direction === 'UP';
    const textCol = isUp ? colors.secondary : colors.danger;
    const iconName = isUp ? ('arrow-up-circle' as const) : ('arrow-down-circle' as const);

    return (
      <View style={styles.comparisonRow}>
        <Ionicons name={iconName} size={15} color={textCol} />
        <Text style={[typography.bodySmall, { color: textCol, fontWeight: '800' }]}>
          {comparison.percentage}% {isUp ? 'vs last period' : 'vs last period'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.bodyMedium, styles.periodLabel, { color: colors.textSecondary }]}>
        {periodLabel}
      </Text>
      
      <Text style={[typography.h1, styles.amountText, { color: colors.text }]}>
        {formatCurrency(totalAmount)}
      </Text>

      <View style={styles.metaRow}>
        {renderComparison()}
        <Text style={[typography.caption, styles.timeText, { color: colors.textSecondary }]}>
          {timeAgo}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  periodLabel: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
  },
  amountText: {
    fontSize: 42,
    fontWeight: '900',
    marginVertical: 6,
    lineHeight: 48,
  },
  metaRow: {
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontWeight: '600',
    fontSize: 10,
  },
});
export default EarningsHero;
