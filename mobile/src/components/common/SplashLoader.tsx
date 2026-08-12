import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

export default function SplashLoader() {
  const { colors, typography, spacing, border } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Radial Glow */}
      <View style={[
        styles.glowRing, 
        { backgroundColor: colors.primary }, 
      ]} />
      
      {/* Central Logo Panel */}
      <View style={styles.logoContainer}>
        {/* Rounded Gold Card Container */}
        <View style={[
          styles.logoCard, 
          { 
            backgroundColor: colors.primary,
            borderColor: colors.border,
            shadowColor: colors.text,
          }
        ]}>
          <Text style={[typography.h1, { color: colors.onPrimary, fontSize: 36, letterSpacing: -1 }]}>
            Just<Text style={{ color: colors.secondary }}>Tap</Text>
          </Text>
        </View>

        <Text style={[
          typography.bodyMedium, 
          { color: colors.textSecondary, marginTop: spacing.xl, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' }
        ]}>
          Instantly Reliable
        </Text>
      </View>

      {/* Progress Spinner */}
      <View style={styles.spinnerContainer}>
        <View style={styles.spinner}>
          <Svg width={40} height={40} viewBox="0 0 40 40">
            <Circle 
              cx={20} 
              cy={20} 
              r={16} 
              stroke={colors.border} 
              strokeWidth={3} 
              fill="transparent" 
            />
            <Circle 
              cx={20} 
              cy={20} 
              r={16} 
              stroke={colors.secondary} 
              strokeWidth={3.5} 
              strokeDasharray={100}
              strokeDashoffset={65}
              strokeLinecap="round"
              fill="transparent" 
            />
          </Svg>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  glowRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
    opacity: 0.15,
    transform: [{ scale: 1.8 }],
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoCard: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  spinnerContainer: {
    position: 'absolute',
    bottom: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
  },
});
