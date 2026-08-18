import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface PendingJob {
  id: string;
  customerName: string;
  distanceKm: number;
  serviceName: string;
  price: number;
  timeWindow: string;
}

interface NewJobRequestCardProps {
  job: PendingJob | null;
  isAccepting: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onViewAll: () => void;
}

export const NewJobRequestCard: React.FC<NewJobRequestCardProps> = ({
  job,
  isAccepting,
  onAccept,
  onReject,
  onViewAll,
}) => {
  const { colors, typography } = useTheme();

  if (!job) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitle}>
              <Ionicons name="notifications-outline" size={18} color={colors.text} />
              <Text style={[typography.bodyLarge, styles.headerText, { color: colors.text }]}>
                New Job Request
              </Text>
            </View>
          </View>
          <View style={styles.emptyContainer}>
            <Ionicons name="radio-outline" size={32} color={colors.textSecondary + '66'} />
            <Text style={[typography.bodyMedium, styles.emptyText, { color: colors.textSecondary }]}>
              Waiting for incoming requests... Keep your availability switch on to receive nearby job offers.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitle}>
            <Ionicons name="notifications" size={18} color="#2563EB" />
            <Text style={[typography.bodyLarge, styles.headerText, { color: colors.text }]}>
              New Job Request
            </Text>
          </View>
          <Pressable onPress={onViewAll}>
            <Text style={[typography.bodySmall, styles.viewAllText, { color: colors.secondary }]}>
              View All
            </Text>
          </Pressable>
        </View>

        {/* Content row */}
        <View style={styles.contentRow}>
          <View style={styles.leftInfo}>
            <Text style={[typography.bodyMedium, styles.customerText, { color: colors.textSecondary }]}>
              {job.customerName}, {job.distanceKm} km away
            </Text>
            <Text style={[typography.h3, styles.serviceText, { color: '#2563EB' }]}>
              {job.serviceName}
            </Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[typography.bodySmall, { color: colors.textSecondary, fontWeight: '600' }]}>
                {job.timeWindow}
              </Text>
            </View>
          </View>

          <View style={styles.rightInfo}>
            <Text style={[typography.h2, styles.priceText, { color: colors.secondary }]}>
              ₹{job.price}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
              Fixed Price
            </Text>
          </View>
        </View>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <Pressable
            disabled={isAccepting}
            onPress={() => onAccept(job.id)}
            style={({ pressed }) => [
              styles.btnAccept,
              { backgroundColor: '#2563EB' },
              pressed && { opacity: 0.9 },
              isAccepting && { opacity: 0.5 }
            ]}
          >
            {isAccepting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.acceptText}>Accept</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            disabled={isAccepting}
            onPress={() => onReject(job.id)}
            style={({ pressed }) => [
              styles.btnReject,
              { borderColor: colors.danger },
              pressed && { opacity: 0.8 }
            ]}
          >
            <View style={styles.btnContent}>
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
              <Text style={[styles.rejectText, { color: colors.danger }]}>Reject</Text>
            </View>
          </Pressable>
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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontWeight: '800',
    fontSize: 15,
  },
  viewAllText: {
    fontWeight: '800',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leftInfo: {
    flex: 1,
    gap: 4,
  },
  customerText: {
    fontWeight: '600',
    fontSize: 13,
  },
  serviceText: {
    fontWeight: '800',
    fontSize: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rightInfo: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 28,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnAccept: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnReject: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  rejectText: {
    fontWeight: '800',
    fontSize: 15,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    paddingHorizontal: 16,
  },
});
