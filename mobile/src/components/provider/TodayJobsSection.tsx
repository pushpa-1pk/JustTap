import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Booking } from '@/redux/api/bookingApi';
import SvgIcon from '../common/SvgIcon';

interface TodayJobsSectionProps {
  bookings: Booking[];
  onViewJob: (bookingId: string) => void;
  onViewAllPress: () => void;
}

export default function TodayJobsSection({
  bookings,
  onViewJob,
  onViewAllPress,
}: TodayJobsSectionProps) {
  const { typography } = useTheme();

  // Limit to maximum 3 cards on the dashboard as requested
  const visibleBookings = bookings.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700' }]}>
          Today's Jobs
        </Text>
        <Pressable onPress={onViewAllPress} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '700' }]}>
            View All →
          </Text>
        </Pressable>
      </View>

      {visibleBookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={[typography.bodyMedium, { color: '#94A3B8' }]}>
            No jobs scheduled for today
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visibleBookings.map((item) => (
            <JobPreviewCard
              key={item._id}
              booking={item}
              onPress={() => onViewJob(item._id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ==========================================
// JOB PREVIEW CARD
// ==========================================
interface JobPreviewCardProps {
  booking: Booking;
  onPress: () => void;
}

function JobPreviewCard({ booking, onPress }: JobPreviewCardProps) {
  const { typography } = useTheme();

  const start = new Date(booking.scheduledStartTime);
  const timeStr = start.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const serviceName = booking.serviceDetails?.name || 'Standard Service';
  const customerName = booking.customerSnapshot?.fullName || 'Client';
  const payout = booking.priceSnapshot?.finalAmount || 399;
  
  // Format status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PROVIDER_RESPONSE': return '#F59E0B';
      case 'PROVIDER_ACCEPTED': return '#3B82F6';
      case 'ON_THE_WAY': return '#3B82F6';
      case 'ARRIVED': return '#16A34A';
      case 'SERVICE_STARTED': return '#16A34A';
      case 'COMPLETED': return '#16A34A';
      case 'CANCELLED': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
      <View style={styles.cardLeft}>
        <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '800' }]}>
          {timeStr}
        </Text>
        <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700', marginTop: 4 }]}>
          {serviceName}
        </Text>
        <Text style={[typography.bodySmall, { color: '#64748B', marginTop: 2 }]}>
          {customerName} • 1.8 km
        </Text>
        
        {/* Status Pill */}
        <View style={[styles.statusPill, { backgroundColor: getStatusColor(booking.status) + '15' }]}>
          <Text style={[typography.caption, { color: getStatusColor(booking.status), fontWeight: '700', fontSize: 10 }]}>
            {booking.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={[typography.h3, { color: '#16A34A', fontWeight: '800' }]}>
          ₹{payout}
        </Text>
        
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.viewBtn,
            { backgroundColor: '#FFF9F0', borderColor: '#FBBF24', borderWidth: 1 },
            pressed && { opacity: 0.8 }
          ]}
        >
          <Text style={[typography.caption, { color: '#0F172A', fontWeight: '700' }]}>
            VIEW
          </Text>
        </Pressable>
      </View>
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    minHeight: 65,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
});
