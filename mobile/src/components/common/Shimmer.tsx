import React from 'react';
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ShimmerProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Shimmer({ width = '100%', height = 20, borderRadius = 8, style }: ShimmerProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.shimmerBox, 
        { 
          width, 
          height, 
          borderRadius, 
          backgroundColor: isDark ? colors.surfaceVariant : '#E2E8F0',
        }, 
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
