import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Modal, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useProviderStore } from '../../../store/providerStore';
import { jobApi } from '../../../api/jobApi';
import { CountdownRing } from './CountdownRing';
import { useTheme } from '../../../hooks/useTheme';

const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav'; // Clean notification beep

export const GlobalJobOfferOverlay: React.FC = () => {
  const router = useRouter();
  const { colors, typography } = useTheme();
  
  const incomingOffer = useProviderStore((state) => state.incomingOffer);
  const offerStage = useProviderStore((state) => state.offerStage);
  
  const clearIncomingOffer = useProviderStore((state) => state.clearIncomingOffer);
  const setOfferStage = useProviderStore((state) => state.setOfferStage);
  const setActiveJob = useProviderStore((state) => state.setActiveJob);

  const soundObjectRef = useRef<Audio.Sound | null>(null);
  const hapticsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // sound and haptic alerts controller loop
  useEffect(() => {
    if (incomingOffer && offerStage === 'OFFER_RECEIVED') {
      setOfferStage('DISPLAYING');
      
      // Initialize loop sound
      const startSound = async () => {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            playThroughEarpieceAndroid: false,
          });
          const { sound } = await Audio.Sound.createAsync(
            { uri: ALARM_SOUND_URL },
            { shouldPlay: true, isLooping: true, volume: 1.0 }
          );
          soundObjectRef.current = sound;
        } catch (err) {
          console.warn('[Overlay] Failed to load alert audio:', err);
        }
      };

      startSound();

      // Trigger repeating haptics (every 1.5 seconds)
      hapticsIntervalRef.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 1500) as any;
    }

    return () => {
      stopAlerts();
    };
  }, [incomingOffer, offerStage]);

  const stopAlerts = async () => {
    if (soundObjectRef.current) {
      try {
        await soundObjectRef.current.stopAsync();
        await soundObjectRef.current.unloadAsync();
      } catch (e) {}
      soundObjectRef.current = null;
    }
    if (hapticsIntervalRef.current) {
      clearInterval(hapticsIntervalRef.current);
      hapticsIntervalRef.current = null;
    }
  };

  if (!incomingOffer || offerStage === 'NO_OFFER') {
    return null;
  }

  const handleExpire = () => {
    if (offerStage === 'ACCEPTING') return; // Do not auto-expire if currently submitting
    setOfferStage('EXPIRED');
    stopAlerts();
    clearIncomingOffer();
  };

  const handleReject = async () => {
    const invitationId = incomingOffer.id;
    stopAlerts();
    setOfferStage('REJECTED');
    clearIncomingOffer(); // Instantly dismiss overlay (Requirement 25)

    try {
      await jobApi.rejectJob(invitationId);
    } catch (err) {
      console.warn('[Overlay] Reject call failed:', err);
    }
  };

  const handleAccept = async () => {
    if (offerStage === 'ACCEPTING') return; // Prevent double-submits
    
    setOfferStage('ACCEPTING');
    await stopAlerts();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const response = await jobApi.acceptJob(incomingOffer.id);
      
      if (response && response.success) {
        setOfferStage('ACCEPTED');
        const booking = response.data;
        
        // Cache active job in global Zustand store
        setActiveJob({
          id: booking._id || booking.id,
          serviceName: booking.serviceDetails?.name || incomingOffer.serviceType,
          status: booking.status || 'ACCEPTED',
          etaMinutes: 10,
        });

        clearIncomingOffer();

        // Route to job tracking stub
        router.push({
          pathname: '/(provider)/job-tracking',
          params: { jobId: booking._id || booking.id },
        });
      } else {
        throw new Error('Offer already taken');
      }
    } catch (err) {
      setOfferStage('NO_OFFER');
      clearIncomingOffer();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert('This job is no longer available.'); // Graceful failure toast/dialog (Requirement 24/26)
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={true}
      onRequestClose={handleReject}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[typography.caption, styles.subtitle, { color: colors.primary }]}>
            NEW JOB REQUEST
          </Text>

          {/* Visual Countdown Progress Ring */}
          <View style={styles.countdownContainer}>
            {incomingOffer.expiresAtTimestamp && (
              <CountdownRing
                expiresAtTimestamp={incomingOffer.expiresAtTimestamp}
                totalDurationSeconds={incomingOffer.expiresInSeconds}
                onExpire={handleExpire}
              />
            )}
          </View>

          {/* Offer Details */}
          <Text style={[typography.h2, styles.titleText, { color: colors.text }]}>
            {incomingOffer.serviceType}
          </Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="location" size={14} color={colors.textSecondary} />
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]}>
                {incomingOffer.distanceKm} km away
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="star" size={14} color="#FBC02D" />
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]}>
                {incomingOffer.customerFirstName} ({incomingOffer.customerRating})
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={[typography.h1, { color: colors.secondary }]}>
              ₹{incomingOffer.price}
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: 8 }]}>
              / ~{incomingOffer.estimatedDurationMinutes} mins
            </Text>
          </View>

          {/* Touch Targets (Requirement 3) */}
          <View style={styles.actionsContainer}>
            <Pressable
              disabled={offerStage === 'ACCEPTING'}
              onPress={handleAccept}
              style={({ pressed }) => [
                styles.acceptButton,
                { backgroundColor: colors.secondary },
                pressed && { opacity: 0.8 },
                offerStage === 'ACCEPTING' && { opacity: 0.5 },
              ]}
              accessibilityLabel="Accept job offer"
              accessibilityRole="button"
            >
              {offerStage === 'ACCEPTING' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.acceptText}>ACCEPT JOB</Text>
              )}
            </Pressable>

            <Pressable
              disabled={offerStage === 'ACCEPTING'}
              onPress={handleReject}
              style={({ pressed }) => [
                styles.rejectButton,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityLabel="Decline job offer"
              accessibilityRole="button"
            >
              <Text style={[styles.rejectText, { color: colors.danger }]}>DECLINE</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // Deep slate overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  subtitle: {
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 20,
  },
  countdownContainer: {
    marginVertical: 12,
  },
  titleText: {
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 16,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  acceptButton: {
    width: '100%',
    height: 56, // 56dp Touch Target
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  rejectButton: {
    width: '100%',
    height: 48, // 48dp Touch Target
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
