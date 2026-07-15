import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export default function OfflineBanner() {
  const { colors, typography } = useTheme();
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useSharedValue(-50); // Hide above top

  useEffect(() => {
    // In a real device, you'd use @react-native-community/netinfo.
    // For demonstration, we simulate checking connection.
    const interval = setInterval(() => {
      // Keep online for now. To simulate offline, set this to true.
      setIsOffline(false); 
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOffline) {
      translateY.value = withTiming(0, { duration: 400 });
    } else {
      translateY.value = withTiming(-50, { duration: 400 });
    }
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.banner, { backgroundColor: colors.warning }, animatedStyle]}>
      <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '800' }]}>
        ⚠️ Network Offline. Operating in disconnected mode.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});
