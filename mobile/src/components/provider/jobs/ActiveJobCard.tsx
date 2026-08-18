import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProviderJob } from '../../../types/job';
import { useTheme } from '../../../hooks/useTheme';

interface ActiveJobCardProps {
  job: ProviderJob;
  isActionLoading: boolean;
  onActionPress: (jobId: string, currentStatus: string) => void;
  onOpenTracking: (jobId: string) => void;
  onPress: () => void;
}

export const ActiveJobCard: React.FC<ActiveJobCardProps> = ({
  job,
  isActionLoading,
  onActionPress,
  onOpenTracking,
  onPress,
}) => {
  const { colors, typography } = useTheme();

  // Action label and status driven by exact job state (Section 13-16)
  const getActionConfig = () => {
    switch (job.status) {
      case 'ACCEPTED':
        return {
          buttonText: 'Start Navigation',
          nextStatus: 'ON_THE_WAY',
          showTracking: false,
          etaText: null,
        };
      case 'ON_THE_WAY':
        return {
          buttonText: "I've Arrived",
          nextStatus: 'ARRIVED',
          showTracking: true,
          etaText: `ETA: ${job.distanceKm ? Math.round(job.distanceKm * 3) : 8} min • Distance: ${job.distanceKm || 1.8} km`,
        };
      case 'ARRIVED':
        return {
          buttonText: 'Start Service',
          nextStatus: 'SERVICE_STARTED',
          showTracking: false,
          etaText: null,
        };
      case 'SERVICE_STARTED':
        return {
          buttonText: 'Complete Service',
          nextStatus: 'COMPLETED',
          showTracking: false,
          etaText: null,
        };
      default:
        return {
          buttonText: 'View Tracking',
          nextStatus: 'TRACKING',
          showTracking: true,
          etaText: null,
        };
    }
  };

  const config = getActionConfig();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: '#2563EB' },
        pressed && { opacity: 0.95 }
      ]}
      accessibilityLabel={`Active Job ${job.serviceName}`}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <Ionicons name="ellipse" size={12} color="#2563EB" />
          <Text style={[typography.caption, styles.headerText, { color: '#2563EB' }]}>
            ACTIVE JOB
          </Text>
        </View>
        <Text style={[typography.caption, styles.statusLabel, { color: '#2563EB', backgroundColor: '#EFF6FF' }]}>
          {job.status.replace(/_/g, ' ')}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.mainInfo}>
          <Text style={[typography.h3, styles.serviceName, { color: colors.text }]}>
            {job.serviceName}
          </Text>
          <Text style={[typography.bodyMedium, styles.customerName, { color: colors.textSecondary }]}>
            Customer: {job.customer.firstName}
          </Text>
        </View>

        {config.etaText && (
          <Text style={[typography.bodySmall, styles.etaText, { color: colors.textSecondary }]}>
            {config.etaText}
          </Text>
        )}
      </View>

      <View style={styles.actionsRow}>
        {config.showTracking && (
          <Pressable
            onPress={() => onOpenTracking(job.id)}
            style={({ pressed }) => [
              styles.btnSecondary,
              { borderColor: '#2563EB' },
              pressed && { opacity: 0.8 }
            ]}
          >
            <Ionicons name="map-outline" size={16} color="#2563EB" />
            <Text style={[styles.btnSecondaryText, { color: '#2563EB' }]}>
              Open Tracking
            </Text>
          </Pressable>
        )}

        <Pressable
          disabled={isActionLoading}
          onPress={() => onActionPress(job.id, job.status)}
          style={({ pressed }) => [
            styles.btnPrimary,
            { backgroundColor: '#2563EB' },
            pressed && { opacity: 0.9 },
            isActionLoading && { opacity: 0.6 }
          ]}
        >
          {isActionLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.btnPrimaryText}>
              {config.buttonText}
            </Text>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  statusLabel: {
    fontWeight: '800',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBody: {
    marginBottom: 16,
  },
  mainInfo: {
    gap: 2,
  },
  serviceName: {
    fontWeight: '800',
    fontSize: 20,
  },
  customerName: {
    fontWeight: '600',
  },
  etaText: {
    fontWeight: '700',
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnPrimary: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  btnSecondary: {
    flex: 1.2,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnSecondaryText: {
    fontWeight: '800',
    fontSize: 14,
  },
});
export default ActiveJobCard;
