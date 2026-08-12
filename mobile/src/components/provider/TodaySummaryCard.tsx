import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface TodaySummaryCardProps {
  jobsCount: number;
  completedCount: number;
  earningsRupees: number;
  rating: number;
}

export default function TodaySummaryCard({
  jobsCount,
  completedCount,
  earningsRupees,
  rating,
}: TodaySummaryCardProps) {
  const { typography } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700', marginBottom: 12 }]}>
        TODAY'S SUMMARY
      </Text>
      
      <View style={styles.grid}>
        {/* Jobs Dispatched */}
        <View style={styles.statBox}>
          <Text style={[typography.caption, { color: '#94A3B8', fontWeight: '600' }]}>JOBS TODAY</Text>
          <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800', marginTop: 4 }]}>
            {jobsCount}
          </Text>
        </View>

        {/* Completed Jobs */}
        <View style={styles.statBox}>
          <Text style={[typography.caption, { color: '#94A3B8', fontWeight: '600' }]}>COMPLETED</Text>
          <Text style={[typography.h2, { color: '#16A34A', fontWeight: '800', marginTop: 4 }]}>
            {completedCount}
          </Text>
        </View>

        {/* Today's Earnings */}
        <View style={styles.statBox}>
          <Text style={[typography.caption, { color: '#94A3B8', fontWeight: '600' }]}>EARNINGS</Text>
          <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800', marginTop: 4 }]}>
            ₹{earningsRupees.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
        </View>

        {/* Customer Rating */}
        <View style={styles.statBox}>
          <Text style={[typography.caption, { color: '#94A3B8', fontWeight: '600' }]}>RATING</Text>
          <View style={styles.ratingRow}>
            <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800', marginTop: 4 }]}>
              {rating.toFixed(1)}
            </Text>
            <Ionicons name="star" size={16} color="#FBBF24" style={{ marginLeft: 4, marginTop: 6 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
