import React from 'react';
import { StyleSheet, Text, View, Pressable, DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface PerformanceCardProps {
  rating: number;
  acceptanceRate: number;
  completionRate: number;
  responseRate: number;
  completedJobs: number;
  onViewPerformancePress: () => void;
}

export default function PerformanceCard({
  rating,
  acceptanceRate,
  completionRate,
  responseRate,
  completedJobs,
  onViewPerformancePress,
}: PerformanceCardProps) {
  const { typography } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700' }]}>
          Your Performance
        </Text>
        <Pressable onPress={onViewPerformancePress} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '700' }]}>
            View →
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
        {/* Rating and Total Jobs Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <View style={styles.starRow}>
              <Ionicons name="star" size={18} color="#FBBF24" />
              <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800', marginLeft: 4 }]}>
                {rating.toFixed(1)}
              </Text>
            </View>
            <Text style={[typography.caption, { color: '#94A3B8', marginTop: 2 }]}>Average Rating</Text>
          </View>
          
          <View style={[styles.verticalDivider, { backgroundColor: '#E5E7EB' }]} />
          
          <View style={styles.summaryBox}>
            <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800' }]}>
              {completedJobs}
            </Text>
            <Text style={[typography.caption, { color: '#94A3B8', marginTop: 2 }]}>Completed Jobs</Text>
          </View>
        </View>

        <View style={[styles.horizontalDivider, { backgroundColor: '#E5E7EB' }]} />

        {/* Sliders / Progress bars */}
        <View style={styles.metricsList}>
          {/* Acceptance Rate */}
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '600' }]}>
                Acceptance Rate
              </Text>
              <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '700' }]}>
                {acceptanceRate}%
              </Text>
            </View>
            <ProgressBar value={acceptanceRate} />
          </View>

          {/* Completion Rate */}
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '600' }]}>
                Completion Rate
              </Text>
              <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '700' }]}>
                {completionRate}%
              </Text>
            </View>
            <ProgressBar value={completionRate} />
          </View>

          {/* Response Rate */}
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '600' }]}>
                Response Rate
              </Text>
              <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '700' }]}>
                {responseRate}%
              </Text>
            </View>
            <ProgressBar value={responseRate} />
          </View>
        </View>
      </View>
    </View>
  );
}

// Simple horizontal progress bar helper
function ProgressBar({ value }: { value: number }) {
  const percentage = `${Math.min(100, Math.max(0, value))}%` as DimensionValue;
  
  // High health is green, moderate is warning, else default (avoiding aggressive red unless extreme)
  const barColor = value >= 90 ? '#16A34A' : value >= 80 ? '#FBBF24' : '#EF4444';

  return (
    <View style={[styles.barBg, { backgroundColor: '#F1F5F9' }]}>
      <View style={[styles.barFill, { width: percentage, backgroundColor: barColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 40,
  },
  horizontalDivider: {
    height: 1,
    marginVertical: 16,
  },
  metricsList: {
    gap: 14,
  },
  metricItem: {},
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
