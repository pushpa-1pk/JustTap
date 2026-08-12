import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

const chats = [
  { id: 'pushpa', name: 'Pushpa Customer', preview: 'Gate code is 2045.', time: 'Now', unread: 1 },
  { id: 'arjun', name: 'Arjun Customer', preview: 'Can we start at 6 PM?', time: '11:05 AM', unread: 0 },
  { id: 'support', name: 'Support', preview: 'Your KYC document was received.', time: 'Yesterday', unread: 0 },
];

export default function ProviderMessagesScreen() {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.h2, { color: colors.text, padding: spacing.xl, paddingBottom: spacing.md }]}>Customer Chats</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={[styles.chatRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.secondary + '30' }]}>
              <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '800' }]}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.chatText}>
              <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{item.name}</Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>{item.preview}</Text>
            </View>
            <View style={styles.meta}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{item.time}</Text>
              {item.unread > 0 && (
                <View style={[styles.unread, { backgroundColor: colors.secondary }]}>
                  <Text style={[typography.caption, { color: colors.onSecondary, fontWeight: '800' }]}>{item.unread}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatText: { flex: 1, marginLeft: 12 },
  meta: { alignItems: 'flex-end', gap: 8 },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
});
