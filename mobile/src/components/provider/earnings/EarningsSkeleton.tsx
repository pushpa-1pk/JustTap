import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

export const EarningsSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Hero skeleton */}
      <View style={styles.heroWrapper}>
        <View style={[styles.shimmer, { width: 80, height: 14, backgroundColor: colors.border }]} />
        <View style={[styles.shimmer, { width: 180, height: 36, marginTop: 12, backgroundColor: colors.border }]} />
        <View style={[styles.shimmer, { width: 140, height: 14, marginTop: 12, backgroundColor: colors.border }]} />
      </View>

      {/* Balance Summary skeleton */}
      <View style={styles.balancesRow}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.shimmer, { width: '80%', height: 10, backgroundColor: colors.border }]} />
          <View style={[styles.shimmer, { width: '60%', height: 22, marginTop: 12, backgroundColor: colors.border }]} />
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.shimmer, { width: '80%', height: 10, backgroundColor: colors.border }]} />
          <View style={[styles.shimmer, { width: '50%', height: 22, marginTop: 12, backgroundColor: colors.border }]} />
        </View>
      </View>

      {/* Standalone Button skeleton */}
      <View style={styles.btnWrapper}>
        <View style={[styles.shimmer, { width: '100%', height: 56, borderRadius: 14, backgroundColor: colors.border }]} />
      </View>

      {/* Chart area skeleton */}
      <View style={[styles.chartContainer, { borderColor: colors.border }]}>
        <View style={[styles.shimmer, { width: 140, height: 12, backgroundColor: colors.border }]} />
        <View style={styles.chartArea}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <View key={key} style={styles.chartCol}>
              <View style={[styles.shimmer, { width: 14, height: Math.floor(Math.random() * 60) + 40, borderRadius: 7, backgroundColor: colors.border }]} />
              <View style={[styles.shimmer, { width: 24, height: 10, marginTop: 8, backgroundColor: colors.border }]} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  heroWrapper: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  shimmer: {
    borderRadius: 4,
  },
  balancesRow: {
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
    height: 90,
    justifyContent: 'center',
  },
  btnWrapper: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartContainer: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    height: 180,
  },
  chartArea: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 20,
  },
  chartCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
export default EarningsSkeleton;
