import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface JobsSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onCancel: () => void;
}

export const JobsSearch: React.FC<JobsSearchProps> = ({
  value,
  onChangeText,
  onCancel,
}) => {
  const { colors, typography } = useTheme();
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    // Focus search input automatically on mount
    inputRef.current?.focus();
  }, []);

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Pressable
        onPress={onCancel}
        style={styles.backBtn}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant }]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search customer, service name, or job ID..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, fontFamily: typography.bodyMedium.fontFamily }]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {value.length > 0 && (
          <Pressable
            onPress={() => onChangeText('')}
            style={styles.clearBtn}
            accessibilityLabel="Clear text"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  inputWrapper: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
export default JobsSearch;
