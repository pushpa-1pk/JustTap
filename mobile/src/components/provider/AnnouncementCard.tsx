import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface AnnouncementCardProps {
  title: string;
  body: string;
  onPress?: () => void;
}

export default function AnnouncementCard({ title, body, onPress }: AnnouncementCardProps) {
  const { typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: '#FFF9F0', borderColor: '#FBBF24' },
        pressed && { opacity: 0.95 }
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Ionicons name="megaphone-sharp" size={18} color="#D97706" />
          <Text style={[typography.bodyMedium, { color: '#D97706', fontWeight: '800', marginLeft: 8 }]}>
            ANNOUNCEMENT
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#D97706" />
      </View>

      <Text style={[typography.bodyMedium, { color: '#0F172A', fontWeight: '700', marginTop: 8 }]}>
        {title}
      </Text>
      <Text style={[typography.bodySmall, { color: '#64748B', marginTop: 4, lineHeight: 16 }]}>
        {body}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
