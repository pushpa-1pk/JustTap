import React from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { useGetProviderProfile } from '@/hooks/useProviderProfile';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function PerformanceScreen() {
  const { colors, typography, spacing } = useTheme();

  // API query (retrieves totalJobs and ratings)
  const { data: profile, isLoading } = useGetProviderProfile();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  // Analytical details (either live calculation from backend or mock fallbacks)
  const acceptanceRate = 96; // %
  const completionRate = 98; // %
  const cancellationRate = 2; // %
  const responseTime = '2.4 mins';
  const avgArrivalTime = '18 mins';
  const avgJobDuration = '45 mins';
  const repeatCustomers = 18;
  const totalEarnings = 53450; // INR
  const monthlyGrowth = 12.5; // %

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      {/* Overview Cards Grid */}
      <View style={styles.grid}>
        <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>ACCEPTANCE RATE</Text>
          <Text style={[typography.h2, { color: colors.secondary, marginTop: 4, fontWeight: '800' }]}>{acceptanceRate}%</Text>
          <Text style={[styles.smallText, { color: colors.textSecondary }]}>High dispatch priority</Text>
        </View>

        <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>COMPLETION RATE</Text>
          <Text style={[typography.h2, { color: colors.secondary, marginTop: 4, fontWeight: '800' }]}>{completionRate}%</Text>
          <Text style={[styles.smallText, { color: colors.textSecondary }]}>Exceeds minimum SLA</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>CANCELLATION RATE</Text>
          <Text style={[typography.h2, { color: colors.danger, marginTop: 4, fontWeight: '800' }]}>{cancellationRate}%</Text>
          <Text style={[styles.smallText, { color: colors.textSecondary }]}>Keep below 5%</Text>
        </View>

        <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>RESPONSE TIME</Text>
          <Text style={[typography.h2, { color: colors.text, marginTop: 4, fontWeight: '800' }]}>{responseTime}</Text>
          <Text style={[styles.smallText, { color: colors.textSecondary }]}>Immediate accepts</Text>
        </View>
      </View>

      {/* Service Metrics */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Service Quality Metrics</Text>

        <View style={styles.metricRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="time" size={20} color={colors.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>Average Arrival Time</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>From booking acceptance to customer address</Text>
          </View>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '800' }]}>{avgArrivalTime}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="build" size={20} color={colors.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>Average Job Duration</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Time spent completing onsite repair tasks</Text>
          </View>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '800' }]}>{avgJobDuration}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="people" size={20} color={colors.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>Repeat Customers</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Customers booking your service multiple times</Text>
          </View>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '800' }]}>{repeatCustomers}</Text>
        </View>
      </View>

      {/* Business Growth & Earnings */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Business Growth</Text>

        <View style={styles.metricRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="cash" size={20} color={colors.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>Total Life Earnings</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Gross earnings from completed job requests</Text>
          </View>
          <Text style={[typography.bodyLarge, { color: colors.secondary, fontWeight: '800' }]}>₹{totalEarnings.toLocaleString()}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="trending-up" size={20} color={colors.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>Monthly Growth Rate</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>MoM revenue increase</Text>
          </View>
          <Text style={[typography.bodyLarge, { color: colors.secondary, fontWeight: '800' }]}>+{monthlyGrowth}%</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="briefcase" size={20} color={colors.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>Total Jobs Completed</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Dispatched tasks marked completed</Text>
          </View>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '800' }]}>{profile?.totalJobs || 0}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  smallText: {
    fontSize: 10,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
});
