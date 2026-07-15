import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface MapProps {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

export default function MapViewComponent({ latitude, longitude, title, description }: MapProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.webMap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
      <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>📍 Local Map (Web Mode)</Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
        {title || 'Service Location'} ({latitude.toFixed(4)}, {longitude.toFixed(4)})
      </Text>
      {description && (
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webMap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
