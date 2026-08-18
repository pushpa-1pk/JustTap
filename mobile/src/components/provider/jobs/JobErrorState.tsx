import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface JobErrorStateProps {
  onRetry: () => void;
}

export const JobErrorState: React.FC<JobErrorStateProps> = ({ onRetry }) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
      <Text style={[typography.h3, styles.title, { color: colors.text }]}>
        Couldn't load your jobs
      </Text>
      <Text style={[typography.bodyMedium, styles.desc, { color: colors.textSecondary }]}>
        Check your internet connection and try again.
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.secondary },
          pressed && { opacity: 0.8 }
        ]}
      >
        <Text style={styles.btnText}>Retry</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  title: {
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  btn: {
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
export default JobErrorState;
