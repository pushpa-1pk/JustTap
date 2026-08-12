import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Booking } from '@/redux/api/bookingApi';
import SvgIcon from '../common/SvgIcon';

interface JobPrioritySectionProps {
  isOnline: boolean;
  pendingRequests: Booking[];
  activeJobs: Booking[];
  isAccepting: boolean;
  onAccept: (bookingId: string) => void;
  onDecline: (bookingId: string) => void;
  onViewJob: (bookingId: string) => void;
  onChat: (bookingId: string) => void;
}

export default function JobPrioritySection({
  isOnline,
  pendingRequests,
  activeJobs,
  isAccepting,
  onAccept,
  onDecline,
  onViewJob,
  onChat,
}: JobPrioritySectionProps) {
  // If provider is offline, do not show any job priority area (or show offline status)
  if (!isOnline) {
    return null;
  }

  // Case A: New Job Request takes highest priority
  if (pendingRequests.length > 0) {
    const booking = pendingRequests[0];
    return (
      <NewJobRequestCard
        booking={booking}
        isAccepting={isAccepting}
        onAccept={() => onAccept(booking._id)}
        onDecline={() => onDecline(booking._id)}
      />
    );
  }

  // Case B: Active Job in progress
  if (activeJobs.length > 0) {
    const booking = activeJobs[0];
    return (
      <ActiveJobCard
        booking={booking}
        onViewJob={() => onViewJob(booking._id)}
        onChat={() => onChat(booking._id)}
      />
    );
  }

  // Case C: Online, but no active jobs or requests
  return <WaitingForJobsCard />;
}

// ==========================================
// 1. NEW JOB REQUEST CARD
// ==========================================
interface NewJobCardProps {
  booking: Booking;
  isAccepting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

function NewJobRequestCard({ booking, isAccepting, onAccept, onDecline }: NewJobCardProps) {
  const { colors, typography } = useTheme();
  
  // Expiration countdown (default to 60 seconds from booking creation if not specified)
  const [timeLeft, setTimeLeft] = useState(18); // default mock-start if negative, but let's count down properly
  
  useEffect(() => {
    const createdAtTime = new Date(booking.createdAt).getTime();
    const durationMs = 60 * 1000; // 60s timeout
    const targetTime = createdAtTime + durationMs;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setTimeLeft(remaining > 0 ? remaining : 18); // Fallback to 18s if it expired but still in queue (demo-like)
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking.createdAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pulse effect for the countdown header
  const headerOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [headerOpacity]);

  const customerName = booking.customerSnapshot?.fullName || 'Customer';
  const price = booking.priceSnapshot?.finalAmount || 499;

  return (
    <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#F59E0B', borderLeftWidth: 5 }]}>
      <Animated.View style={[styles.newJobBadgeRow, { opacity: headerOpacity }]}>
        <Ionicons name="alert-circle" size={16} color="#F59E0B" />
        <Text style={[typography.caption, { color: '#F59E0B', fontWeight: '800', letterSpacing: 1 }]}>
          NEW JOB REQUEST DISPATCHED
        </Text>
      </Animated.View>

      <View style={styles.jobDetailHeader}>
        <View>
          <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800' }]}>
            {booking.serviceDetails?.name || 'Standard Service Repair'}
          </Text>
          <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 2 }]}>
            Client: {customerName}
          </Text>
        </View>
        <View style={[styles.serviceIconContainer, { backgroundColor: '#FFF9F0' }]}>
          <SvgIcon name={booking.serviceDetails?.name || 'service'} color="#FBBF24" size={26} />
        </View>
      </View>

      <View style={[styles.horizontalDivider, { backgroundColor: '#E5E7EB' }]} />

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={[typography.caption, { color: '#94A3B8' }]}>DISTANCE</Text>
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700', marginTop: 2 }]}>
            📍 1.4 km
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={[typography.caption, { color: '#94A3B8' }]}>EST. ARRIVAL</Text>
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700', marginTop: 2 }]}>
            ⏱ 8 min
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={[typography.caption, { color: '#94A3B8' }]}>PAYOUT</Text>
          <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '800', marginTop: 2 }]}>
            ₹{price}
          </Text>
        </View>
      </View>

      <View style={[styles.horizontalDivider, { backgroundColor: '#E5E7EB' }]} />

      <View style={styles.countdownRow}>
        <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '500' }]}>
          Request expires in:
        </Text>
        <Text style={[typography.h3, { color: '#EF4444', fontWeight: '800' }]}>
          {formatTime(timeLeft)}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={onDecline}
          style={({ pressed }) => [
            styles.declineBtn,
            { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB', borderWidth: 1 },
            pressed && { opacity: 0.8 }
          ]}
        >
          <Text style={[typography.bodyMedium, { color: '#EF4444', fontWeight: '700' }]}>
            DECLINE
          </Text>
        </Pressable>

        <Pressable
          onPress={onAccept}
          disabled={isAccepting}
          style={({ pressed }) => [
            styles.acceptBtn,
            { backgroundColor: '#16A34A' },
            pressed && { opacity: 0.8 }
          ]}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>
              ACCEPT REQUEST
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ==========================================
// 2. ACTIVE JOB CARD
// ==========================================
interface ActiveJobCardProps {
  booking: Booking;
  onViewJob: () => void;
  onChat: () => void;
}

function ActiveJobCard({ booking, onViewJob, onChat }: ActiveJobCardProps) {
  const { typography } = useTheme();

  const handleCall = () => {
    const phone = booking.customerSnapshot?.phone || '9999999999';
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = () => {
    const coords = booking.customerAddressSnapshot?.location?.coordinates || [72.8777, 19.076];
    const url = `https://www.google.com/maps/search/?api=1&query=${coords[1]},${coords[0]}`;
    Linking.openURL(url);
  };

  const customerName = booking.customerSnapshot?.fullName || 'Customer';
  const address = `${booking.customerAddressSnapshot?.addressLine1}, ${booking.customerAddressSnapshot?.city}`;
  
  // Translate status to user friendly string
  const getFriendlyStatus = (status: string) => {
    switch(status) {
      case 'PROVIDER_ACCEPTED': return 'Provider On The Way';
      case 'ON_THE_WAY': return 'Traveling to Customer';
      case 'ARRIVED': return 'Arrived at Destination';
      case 'SERVICE_STARTED': return 'Service in Progress';
      default: return 'Job Accepted';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#16A34A', borderLeftWidth: 5 }]}>
      <View style={styles.activeJobBadgeRow}>
        <View style={[styles.activeDot, { backgroundColor: '#16A34A' }]} />
        <Text style={[typography.caption, { color: '#16A34A', fontWeight: '800', letterSpacing: 1 }]}>
          ACTIVE JOB IN PROGRESS
        </Text>
      </View>

      <View style={styles.jobDetailHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h2, { color: '#0F172A', fontWeight: '800' }]}>
            {booking.serviceDetails?.name || 'AC Repair / General Service'}
          </Text>
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '600', marginTop: 4 }]}>
            Client: {customerName}
          </Text>
          <Text style={[typography.caption, { color: '#64748B', marginTop: 2 }]}>
            Booking ID: #{booking._id.slice(-7).toUpperCase()}
          </Text>
        </View>
        <View style={[styles.serviceIconContainer, { backgroundColor: '#FFF9F0' }]}>
          <SvgIcon name={booking.serviceDetails?.name || 'service'} color="#16A34A" size={26} />
        </View>
      </View>

      <View style={styles.addressPanel}>
        <Ionicons name="location-sharp" size={16} color="#64748B" style={{ marginTop: 2 }} />
        <Text style={[typography.bodyMedium, { color: '#64748B', flex: 1, marginLeft: 6 }]} numberOfLines={2}>
          {address}
        </Text>
      </View>

      <View style={[styles.horizontalDivider, { backgroundColor: '#E5E7EB' }]} />

      <View style={styles.activeMetaRow}>
        <View style={styles.activeMetaItem}>
          <Text style={[typography.caption, { color: '#94A3B8' }]}>STATUS</Text>
          <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '700', marginTop: 2 }]}>
            {getFriendlyStatus(booking.status)}
          </Text>
        </View>
        <View style={styles.activeMetaItem}>
          <Text style={[typography.caption, { color: '#94A3B8' }]}>DISTANCE</Text>
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700', marginTop: 2 }]}>
            1.2 km
          </Text>
        </View>
        <View style={styles.activeMetaItem}>
          <Text style={[typography.caption, { color: '#94A3B8' }]}>ETA</Text>
          <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700', marginTop: 2 }]}>
            8 min
          </Text>
        </View>
      </View>

      <View style={[styles.horizontalDivider, { backgroundColor: '#E5E7EB' }]} />

      <View style={styles.activeBtnGrid}>
        <Pressable
          onPress={handleNavigate}
          style={({ pressed }) => [
            styles.gridActionBtn,
            { backgroundColor: '#FFF9F0', borderColor: '#FBBF24', borderWidth: 1 },
            pressed && { opacity: 0.8 }
          ]}
        >
          <Ionicons name="navigate-outline" size={16} color="#FBBF24" />
          <Text style={[typography.bodySmall, { color: '#0F172A', fontWeight: '700', marginLeft: 4 }]}>
            NAVIGATE
          </Text>
        </Pressable>

        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [
            styles.gridActionBtn,
            { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB', borderWidth: 1 },
            pressed && { opacity: 0.8 }
          ]}
        >
          <Ionicons name="call-outline" size={16} color="#0F172A" />
          <Text style={[typography.bodySmall, { color: '#0F172A', fontWeight: '700', marginLeft: 4 }]}>
            CALL
          </Text>
        </Pressable>

        <Pressable
          onPress={onChat}
          style={({ pressed }) => [
            styles.gridActionBtn,
            { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB', borderWidth: 1 },
            pressed && { opacity: 0.8 }
          ]}
        >
          <Ionicons name="chatbubbles-outline" size={16} color="#0F172A" />
          <Text style={[typography.bodySmall, { color: '#0F172A', fontWeight: '700', marginLeft: 4 }]}>
            CHAT
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onViewJob}
        style={({ pressed }) => [
          styles.viewActiveJobBtn,
          { backgroundColor: '#16A34A' },
          pressed && { opacity: 0.9 }
        ]}
      >
        <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>
          VIEW ACTIVE JOB STEPPER
        </Text>
      </Pressable>
    </View>
  );
}

// ==========================================
// 3. WAITING FOR JOBS CARD
// ==========================================
function WaitingForJobsCard() {
  const { typography } = useTheme();
  
  // Concentric circle scale animations
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const anim1 = createAnimation(wave1, 0);
    const anim2 = createAnimation(wave2, 1000);

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [wave1, wave2]);

  const waveStyle = (anim: Animated.Value) => ({
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.5]
      })
    }],
    opacity: anim.interpolate({
      inputRange: [0, 0.8, 1],
      outputRange: [0.3, 0.15, 0]
    })
  });

  return (
    <View style={[styles.card, styles.waitingCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
      <View style={styles.radarWrapper}>
        <Animated.View style={[styles.radarWave, waveStyle(wave1)]} />
        <Animated.View style={[styles.radarWave, waveStyle(wave2)]} />
        <View style={[styles.radarCenter, { backgroundColor: '#16A34A' }]}>
          <Ionicons name="radio" size={24} color="#FFFFFF" />
        </View>
      </View>
      
      <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700', marginTop: 16 }]}>
        Waiting for nearby requests...
      </Text>
      <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 4, textAlign: 'center', paddingHorizontal: 16 }]}>
        Keep this screen open. We will dispatch nearby booking requests immediately.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  newJobBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  activeJobBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  jobDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalDivider: {
    height: 1,
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  addressPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  activeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activeMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBtnGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  gridActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewActiveJobBtn: {
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  waitingCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  radarWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radarCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  radarWave: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16A34A',
    zIndex: 1,
  },
});
