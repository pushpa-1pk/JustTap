import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Shimmer({ width = '100%', height = 20, borderRadius = 8, style }: ShimmerProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Pulse animation
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View 
      style={[
        styles.shimmerBox, 
        { 
          width, 
          height, 
          borderRadius, 
          backgroundColor: colors.isDark ? colors.surfaceVariant : '#E2E8F0',
        }, 
        animatedStyle,
        style
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  shimmerBox: {
    overflow: 'hidden',
  },
});
