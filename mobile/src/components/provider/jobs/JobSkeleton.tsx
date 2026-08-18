import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

export const JobSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.topRow}>
            <View style={styles.leftCol}>
              <View style={[styles.shimmerBar, { width: '60%', backgroundColor: colors.border }]} />
              <View style={[styles.shimmerBar, { width: '40%', height: 12, marginTop: 8, backgroundColor: colors.border }]} />
            </View>
            <View style={[styles.shimmerBadge, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.middleRow}>
            <View style={[styles.shimmerBar, { width: '35%', height: 12, backgroundColor: colors.border }]} />
            <View style={[styles.shimmerBar, { width: '25%', height: 12, backgroundColor: colors.border }]} />
          </View>
          <View style={styles.bottomRow}>
            <View style={[styles.shimmerBar, { width: '40%', height: 12, backgroundColor: colors.border }]} />
            <View style={[styles.shimmerBar, { width: '20%', height: 20, backgroundColor: colors.border }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    height: 140,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: 1,
    gap: 4,
  },
  shimmerBar: {
    height: 18,
    borderRadius: 4,
  },
  shimmerBadge: {
    width: 80,
    height: 24,
    borderRadius: 8,
  },
  middleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
});
export default JobSkeleton;
