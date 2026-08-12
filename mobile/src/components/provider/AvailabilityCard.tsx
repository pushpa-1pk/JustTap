import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AvailabilityCardProps {
  isOnline: boolean;
  isToggling: boolean;
  onToggle: () => void;
}

export default function AvailabilityCard({ isOnline, isToggling, onToggle }: AvailabilityCardProps) {
  const { colors, typography, border } = useTheme();
  
  // Animation scale value for pulse effect
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isOnline) {
      // Loop pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0.4);
    }
  }, [isOnline, pulseAnim]);

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: '#FFFFFF', 
        borderColor: isOnline ? '#16A34A' : '#E5E7EB',
        borderLeftWidth: 5,
      }
    ]}>
      <View style={styles.contentRow}>
        <View style={styles.statusInfo}>
          <View style={styles.titleRow}>
            {isOnline ? (
              <>
                <Animated.View style={[
                  styles.pulseDot, 
                  { 
                    backgroundColor: '#22C55E', 
                    opacity: pulseAnim,
                    transform: [{ scale: pulseAnim.interpolate({
                      inputRange: [0.4, 1],
                      outputRange: [0.9, 1.3]
                    })}]
                  }
                ]} />
                <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700' }]}>
                  YOU'RE ONLINE
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.grayDot, { backgroundColor: '#94A3B8' }]} />
                <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700' }]}>
                  YOU'RE OFFLINE
                </Text>
              </>
            )}
          </View>
          <Text style={[typography.bodyMedium, { color: '#64748B', marginTop: 4 }]}>
            {isOnline 
              ? 'Ready to receive new job requests' 
              : 'You won\'t receive new requests'}
          </Text>
        </View>

        <Pressable
          onPress={onToggle}
          disabled={isToggling}
          style={({ pressed }) => [
            styles.toggleBtn,
            { 
              backgroundColor: isOnline ? '#F1F5F9' : '#16A34A',
              borderColor: isOnline ? '#E5E7EB' : '#15803D',
              borderWidth: isOnline ? 1 : 0
            },
            pressed && { opacity: 0.8 }
          ]}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={isOnline ? '#64748B' : '#FFFFFF'} />
          ) : (
            <Text style={[
              typography.bodySmall, 
              { 
                color: isOnline ? '#0F172A' : '#FFFFFF', 
                fontWeight: '700',
                letterSpacing: 0.5 
              }
            ]}>
              {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  grayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
