import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProviderJob } from '../../../types/job';
import { JobStatusBadge } from './JobStatusBadge';
import { PaymentStatusIndicator } from './PaymentStatusIndicator';
import { useTheme } from '../../../hooks/useTheme';

interface JobCardProps {
  job: ProviderJob;
  onPress: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  const { colors, typography } = useTheme();

  const formatScheduledTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `Today • ${timeStr}`;
      }
      
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${dateStr} • ${timeStr}`;
    } catch (e) {
      return dateString;
    }
  };

  const renderCardContent = () => {
    switch (job.status) {
      case 'COMPLETED':
        return (
          <View style={styles.cardBody}>
            {/* Top row: Service Name + Payment Status */}
            <View style={styles.row}>
              <View style={styles.serviceCol}>
                <Text style={[typography.h3, styles.serviceName, { color: colors.text }]}>
                  ✓ {job.serviceName}
                </Text>
                <Text style={[typography.bodyMedium, styles.customerName, { color: colors.textSecondary }]}>
                  {job.customer.firstName}
                </Text>
              </View>
              <PaymentStatusIndicator paymentStatus={job.paymentStatus} />
            </View>

            {/* Mid row: Time + Rating */}
            <View style={styles.row}>
              <View style={styles.infoGroup}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                  {formatScheduledTime(job.scheduledAt)}
                </Text>
              </View>
              {job.rating !== undefined && job.rating !== null && (
                <Text style={[typography.bodySmall, styles.ratingText, { color: '#FBC02D' }]}>
                  Customer rating: ⭐ {job.rating.toFixed(1)}
                </Text>
              )}
            </View>

            {/* Price row */}
            <View style={styles.priceRow}>
              <Text style={[typography.h2, { color: colors.secondary }]}>
                ₹{job.estimatedEarnings}
              </Text>
            </View>
          </View>
        );

      case 'CANCELLED':
        const cancelledByLabel = job.cancellation?.cancelledBy 
          ? `Cancelled by ${job.cancellation.cancelledBy.charAt(0) + job.cancellation.cancelledBy.slice(1).toLowerCase()}` 
          : 'Cancelled';
        
        return (
          <View style={styles.cardBody}>
            {/* Top row: Service Name + Status Badge */}
            <View style={styles.row}>
              <View style={styles.serviceCol}>
                <Text style={[typography.h3, styles.serviceName, { color: colors.text }]}>
                  {job.serviceName}
                </Text>
                <Text style={[typography.bodyMedium, styles.customerName, { color: colors.textSecondary }]}>
                  {job.customer.firstName}
                </Text>
              </View>
              <JobStatusBadge status={job.status} />
            </View>

            {/* Cancellation details (Section 20) */}
            <View style={[styles.cancelBlock, { backgroundColor: '#FEF2F2' }]}>
              <Text style={[typography.bodySmall, { color: colors.danger, fontWeight: '700' }]}>
                {cancelledByLabel}
              </Text>
              {job.cancellation?.reason && (
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, fontWeight: '600' }]}>
                  Reason: {job.cancellation.reason}
                </Text>
              )}
            </View>

            {/* Time row */}
            <View style={styles.row}>
              <View style={styles.infoGroup}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                  {formatScheduledTime(job.scheduledAt)}
                </Text>
              </View>
            </View>
          </View>
        );

      default: // Upcoming tabs: SCHEDULED, ACCEPTED
        return (
          <View style={styles.cardBody}>
            {/* Top row: Service Name + Status Badge */}
            <View style={styles.row}>
              <View style={styles.serviceCol}>
                <Text style={[typography.h3, styles.serviceName, { color: colors.text }]}>
                  {job.serviceName}
                </Text>
                <Text style={[typography.bodyMedium, styles.customerName, { color: colors.textSecondary }]}>
                  {job.customer.firstName}
                </Text>
              </View>
              <JobStatusBadge status={job.status} />
            </View>

            {/* Mid row: Time + Distance */}
            <View style={styles.row}>
              <View style={styles.infoGroup}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                  {formatScheduledTime(job.scheduledAt)}
                </Text>
              </View>
              {job.distanceKm !== undefined && (
                <View style={styles.infoGroup}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                    {job.distanceKm} km away
                  </Text>
                </View>
              )}
            </View>

            {/* Price row */}
            <View style={styles.earningsRow}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Estimated earnings
              </Text>
              <Text style={[typography.h3, { color: colors.secondary, fontWeight: '800' }]}>
                ₹{job.estimatedEarnings}
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.95 }
      ]}
      accessibilityLabel={`View job details for ${job.serviceName}`}
      accessibilityRole="button"
    >
      {renderCardContent()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    minHeight: 120,
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
  cardBody: {
    flex: 1,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceCol: {
    flex: 1,
    paddingRight: 8,
  },
  serviceName: {
    fontWeight: '800',
    fontSize: 18,
  },
  customerName: {
    fontWeight: '600',
    marginTop: 2,
  },
  infoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 4,
  },
  priceRow: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  ratingText: {
    fontWeight: '700',
  },
  cancelBlock: {
    borderRadius: 8,
    padding: 10,
    marginTop: 2,
  },
});
export default JobCard;
