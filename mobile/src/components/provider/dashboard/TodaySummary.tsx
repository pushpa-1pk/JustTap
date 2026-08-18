import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface TodaySummaryProps {
  jobsCount: number;
  completedCount: number;
  rating: number;
  weeklyEarnings: number;
}

export const TodaySummary: React.FC<TodaySummaryProps> = ({
  jobsCount,
  completedCount,
  rating,
  weeklyEarnings,
}) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[typography.caption, styles.sectionTitle, { color: colors.textSecondary }]}>
        Today's Overview
      </Text>

      <View style={styles.gridContainer}>
        {/* Row 1 */}
        <View style={styles.gridRow}>
          {/* Card 1: Today's Jobs */}
          <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="briefcase" size={20} color="#3B82F6" />
            </View>
            <Text style={[typography.h2, styles.valueText, { color: colors.text }]}>
              {jobsCount}
            </Text>
            <Text style={[typography.bodySmall, styles.labelText, { color: colors.textSecondary }]}>
              Today's Jobs
            </Text>
          </View>

          {/* Card 2: Total Completed */}
          <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
            </View>
            <Text style={[typography.h2, styles.valueText, { color: colors.text }]}>
              {completedCount}
            </Text>
            <Text style={[typography.bodySmall, styles.labelText, { color: colors.textSecondary }]}>
              Total Completed
            </Text>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          {/* Card 3: Avg. Rating */}
          <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEFBE8' }]}>
              <Ionicons name="star" size={20} color="#F59E0B" />
            </View>
            <Text style={[typography.h2, styles.valueText, { color: colors.text }]}>
              {rating ? rating.toFixed(1) : '0.0'}
            </Text>
            <Text style={[typography.bodySmall, styles.labelText, { color: colors.textSecondary }]}>
              Avg. Rating
            </Text>
          </View>

          {/* Card 4: This Week Earning */}
          <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="cash" size={20} color="#10B981" />
            </View>
            <Text style={[typography.h2, styles.valueText, { color: colors.secondary }]}>
              ₹{weeklyEarnings ? weeklyEarnings.toLocaleString() : '0'}
            </Text>
            <Text style={[typography.bodySmall, styles.labelText, { color: colors.textSecondary }]}>
              This Week Earning
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  valueText: {
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 28,
  },
  labelText: {
    marginTop: 4,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
});
