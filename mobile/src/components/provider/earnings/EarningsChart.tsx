import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EarningsChartData } from '../../../types/earnings';
import { useTheme } from '../../../hooks/useTheme';

interface EarningsChartProps {
  data: EarningsChartData | null;
}

export const EarningsChart: React.FC<EarningsChartProps> = ({ data }) => {
  const { colors, typography } = useTheme();

  if (!data || !data.points || data.points.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { borderColor: colors.border }]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>
          No earnings data for this period
        </Text>
      </View>
    );
  }

  // Find max value to normalize bar heights
  const maxVal = Math.max(...data.points.map((p) => p.value), 100);
  const totalPeriodEarnings = data.points.reduce((sum, p) => sum + p.value, 0);

  // Find the highest point for screen reader summaries
  const sortedPoints = [...data.points].sort((a, b) => b.value - a.value);
  const highestPoint = sortedPoints[0];

  const accessibilityString = `Earnings summary: total ₹${totalPeriodEarnings.toLocaleString('en-IN')}. Highest period label was ${highestPoint.label} with ₹${highestPoint.value.toLocaleString('en-IN')}.`;

  return (
    <View
      style={[styles.container, { borderColor: colors.border }]}
      accessibilityLabel={accessibilityString}
      accessibilityRole="image"
    >
      <Text style={[typography.caption, styles.chartTitle, { color: colors.textSecondary }]}>
        EARNINGS SUMMARY ({data.interval})
      </Text>

      <View style={styles.chartArea}>
        {data.points.map((point, index) => {
          // Normalize height between 10% and 100% of max height (120dp)
          const barHeightPct = maxVal > 0 ? (point.value / maxVal) * 100 : 0;

          return (
            <View key={point.label + index} style={styles.chartCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${Math.max(barHeightPct, 4)}%`,
                      backgroundColor: point.value > 0 ? colors.primary : '#E2E8F0',
                    },
                  ]}
                />
              </View>
              <Text style={[typography.caption, styles.label, { color: colors.textSecondary }]}>
                {point.label}
              </Text>
              {point.value > 0 && (
                <Text style={[styles.valueLabel, { color: colors.text }]}>
                  ₹{Math.round(point.value)}
                </Text>
              )}
            </View>
          );
        })}
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
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  chartArea: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: 14,
    borderRadius: 7,
    backgroundColor: '#F1F5F9',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  label: {
    marginTop: 8,
    fontWeight: '700',
    fontSize: 10,
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
});
export default EarningsChart;
