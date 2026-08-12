import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function OfflineBanner() {
  const { colors, typography } = useTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // In a real device, you'd use @react-native-community/netinfo.
    // For local testing we keep the app online unless this is wired later.
    const interval = setInterval(() => {
      setIsOffline(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning }]}>
      <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '800' }]}>
        Network Offline. Operating in disconnected mode.
      </Text>
    </View>
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
