import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface ActiveJobBannerProps {
  serviceName: string;
  etaMinutes: number | null;
  status: string;
  onPress: () => void;
}

export const ActiveJobBanner: React.FC<ActiveJobBannerProps> = ({
  serviceName,
  etaMinutes,
  status,
  onPress,
}) => {
  const { typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.banner,
        pressed && { opacity: 0.9 }
      ]}
      accessibilityLabel={`Active job: ${serviceName}. Tap to view tracking details.`}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Ionicons name="ellipse" size={12} color="#FFFFFF" style={styles.dotIcon} />
        <Text style={[typography.bodyMedium, styles.text]}>
          Active: {serviceName} · {etaMinutes ? `ETA ${etaMinutes} mins` : 'On site'} · {status.replace('_', ' ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  banner: {
    height: 48,
    backgroundColor: '#2563EB', // Blue base color (Section 10)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dotIcon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
