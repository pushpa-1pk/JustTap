import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useProviderStore } from '../../store/providerStore';

export default function JobTrackingScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const activeJob = useProviderStore((state) => state.activeJob);
  const setActiveJob = useProviderStore((state) => state.setActiveJob);

  const handleCompleteJob = () => {
    setActiveJob(null);
    router.replace('/(provider)/(tabs)/dashboard');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Ionicons name="map-outline" size={80} color={colors.secondary} />
        <Text style={[typography.h2, { color: colors.text, marginTop: 24, textAlign: 'center' }]}>
          Active Job Progress
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }]}>
          You are currently performing the job: {activeJob?.serviceName || 'AC Repair'} (ID: {jobId || 'N/A'}).
        </Text>

        <Pressable
          onPress={handleCompleteJob}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.secondary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.buttonText}>Complete Job</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 40,
    width: 200,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
