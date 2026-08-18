import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface DashboardHeaderProps {
  businessName: string;
  profileImage: string | null;
  onAvatarPress: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  businessName,
  profileImage,
  onAvatarPress,
}) => {
  const { colors, typography } = useTheme();

  // Extract first name
  const getFirstName = (name: string) => {
    if (!name) return 'Provider';
    return name.split(/[\s,.-]+/)[0];
  };

  const displayName = getFirstName(businessName);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftContainer}>
        <Text style={[typography.h2, styles.greetingText, { color: colors.text }]}>
          Hello {displayName}
        </Text>
        <Text style={[typography.bodyMedium, styles.subText, { color: colors.textSecondary }]}>
          Here's what's happening today.
        </Text>
      </View>

      <Pressable
        onPress={onAvatarPress}
        style={styles.avatarButton}
        accessibilityLabel="View Profile"
        accessibilityRole="button"
      >
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarLetter, { color: colors.onPrimary }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  leftContainer: {
    flex: 1,
    paddingRight: 16,
  },
  greetingText: {
    fontWeight: '800',
    fontSize: 26,
    lineHeight: 32,
  },
  subText: {
    marginTop: 4,
    fontWeight: '500',
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '800',
  },
});
