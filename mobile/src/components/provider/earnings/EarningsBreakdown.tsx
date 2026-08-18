import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EarningsSummary } from '../../../types/earnings';
import { useTheme } from '../../../hooks/useTheme';

interface EarningsBreakdownProps {
  summary: EarningsSummary;
}

export const EarningsBreakdown: React.FC<EarningsBreakdownProps> = ({ summary }) => {
  const { colors, typography } = useTheme();

  const formatCurrency = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  // Section 21 & 22: Display transparent commissions/commission fees
  const baseEarnings = summary.totalEarnings;
  const platformFee = Math.round(baseEarnings * 0.08); // 8% fee commission
  const netEarnings = baseEarnings - platformFee;

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <Text style={[typography.caption, styles.sectionTitle, { color: colors.textSecondary }]}>
        EARNINGS BREAKDOWN
      </Text>

      <View style={styles.breakdownList}>
        {/* Jobs Completed */}
        <View style={styles.row}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            Jobs Completed
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
            {summary.completedJobs}
          </Text>
        </View>

        {/* Gross Earnings */}
        <View style={styles.row}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            Gross Service Earnings
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
            {formatCurrency(baseEarnings)}
          </Text>
        </View>

        {/* Platform Fees */}
        <View style={styles.row}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            Platform Commission (8%)
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.danger, fontWeight: '700' }]}>
            -{formatCurrency(platformFee)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Net Total */}
        <View style={styles.row}>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '800' }]}>
            Net Earnings
          </Text>
          <Text style={[typography.h3, { color: colors.secondary, fontWeight: '800' }]}>
            {formatCurrency(netEarnings)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  breakdownList: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
export default EarningsBreakdown;
