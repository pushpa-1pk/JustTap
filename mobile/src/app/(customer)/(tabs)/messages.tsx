import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

// Chat has no customer messaging API or socket contract yet.  Keep this screen
// honest until persisted, authenticated conversations are available.
export default function CustomerMessagesScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
    <Text style={[typography.h2, { color: colors.text, marginTop: 16 }]}>Messages are not available yet</Text>
    <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>We will show conversations here only when messages can be securely sent, stored, and delivered to the provider or support team.</Text>
    <Pressable onPress={() => router.push('/support')} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Contact support</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 }, button: { marginTop: 24, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 10 } });
