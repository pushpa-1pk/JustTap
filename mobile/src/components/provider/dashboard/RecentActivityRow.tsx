import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RecentJob } from '../../../types/provider';
import { useTheme } from '../../../hooks/useTheme';

interface RecentActivityRowProps {
  job: RecentJob;
}

export const RecentActivityRow: React.FC<RecentActivityRowProps> = ({ job }) => {
  const { colors, typography } = useTheme();

  const formatTimeAgo = (dateString: string) => {
    const elapsedMs = Date.now() - new Date(dateString).getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
    
    if (elapsedMinutes < 1) return 'Just now';
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
    
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;
    
    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${elapsedDays}d ago`;
  };

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        <Text style={[typography.bodyMedium, styles.serviceNameText, { color: colors.text }]}>
          {job.serviceName}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {formatTimeAgo(job.completedAt)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[typography.bodyMedium, styles.priceText, { color: colors.secondary }]}>
          ₹{job.amount}
        </Text>
        {job.rating !== null && (
          <Text style={[typography.caption, { color: '#FBC02D', fontWeight: '700' }]}>
            ⭐ {job.rating.toFixed(1)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  left: {
    flex: 1,
  },
  serviceNameText: {
    fontWeight: '700',
    marginBottom: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontWeight: '800',
    marginBottom: 2,
  },
});
