import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGetProviderProfile, useUpdateProviderProfile, useCreateProviderProfile } from '@/hooks/useProviderProfile';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { useTheme } from '@/hooks/useTheme';
import { useDispatch } from 'react-redux';
import { updateUser } from '@/redux/slices/authSlice';

const providerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  businessName: z.string().min(3, 'Business name must be at least 3 characters'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().or(z.literal('')),
  experience: z.string().regex(/^\d+$/, 'Experience must be a positive number'),
  workingRadius: z.string().regex(/^\d+$/, 'Working radius must be at least 1 km'),
  gender: z.enum(['Male', 'Female', 'Other']).nullable().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format').nullable().optional().or(z.literal('')),
  language: z.string().min(2, 'Languages spoken is required'),
  emergencyContact: z.object({
    name: z.string().min(2, 'Contact name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    relationship: z.string().min(2, 'Relationship is required'),
  }),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

export default function EditProviderProfileScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: profile, isLoading: isProfileLoading, refetch } = useGetProviderProfile();
  const updateProfileMutation = useUpdateProviderProfile();
  const createProfileMutation = useCreateProviderProfile();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      fullName: '',
      businessName: '',
      bio: '',
      experience: '2',
      workingRadius: '10',
      gender: 'Male',
      dateOfBirth: '1990-01-01',
      language: 'English',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
    },
  });

  useEffect(() => {
    if (profile) {
      setValue('fullName', profile.fullName || '');
      setValue('businessName', profile.businessName || '');
      setValue('bio', profile.bio || '');
      setValue('experience', String(profile.experience || 0));
      setValue('workingRadius', String(profile.workingRadius || 10));
      setValue('gender', (profile.gender as 'Male' | 'Female' | 'Other') || 'Male');
      setValue(
        'dateOfBirth',
        profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : '1990-01-01'
      );
      setValue('language', profile.language || 'English');
      setAvatarUri(profile.profileImage || null);

      if (profile.emergencyContact) {
        setValue('emergencyContact.name', profile.emergencyContact.name || '');
        setValue('emergencyContact.phone', profile.emergencyContact.phone || '');
        setValue('emergencyContact.relationship', profile.emergencyContact.relationship || '');
      }
    }
  }, [profile, setValue]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant library permissions in settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const localUri = result.assets[0].uri;
      setAvatarUri(localUri);

      // Upload to Cloudinary immediately
      setIsUploading(true);
      try {
        const cloudinaryRes = await uploadToCloudinary(localUri);
        
        // Save image details to Profile Service if profile exists
        if (profile) {
          await updateProfileMutation.mutateAsync({
            profileImage: cloudinaryRes.secure_url,
            profileImageStorageKey: cloudinaryRes.public_id,
            profileImageStorageProvider: 'cloudinary',
          });
          refetch();
        } else {
          setAvatarUri(cloudinaryRes.secure_url);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Profile image updated successfully!');
      } catch (err: any) {
        console.error('Image upload failed:', err);
        Alert.alert('Error', err?.message || 'Failed to upload image to Cloudinary.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const onSubmit = async (values: ProviderFormValues) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const hasProfile = Boolean(profile);
      const payload = {
        ...values,
        experience: Number(values.experience),
        workingRadius: Number(values.workingRadius),
        gender: values.gender as any,
        dateOfBirth: values.dateOfBirth || null,
        ...(avatarUri && !avatarUri.startsWith('ph://') && !avatarUri.startsWith('file://') && { profileImage: avatarUri }),
      };

      if (hasProfile) {
        await updateProfileMutation.mutateAsync(payload);
      } else {
        await createProfileMutation.mutateAsync(payload);
      }

      dispatch(updateUser({ isProfileComplete: true }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
      Alert.alert('Success', 'Provider profile saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (!hasProfile) {
              router.replace('/(provider)/(tabs)/dashboard');
            } else {
              router.back();
            }
          },
        },
      ]);
    } catch (err: any) {
      console.error('Update profile failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err?.message || 'Failed to update profile. Please try again.');
    }
  };

  if (isProfileLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: profile ? 'Edit Provider Profile' : 'Complete Provider Profile' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scroll}
      >
        {/* Profile Picture Section */}
        <View style={styles.avatarContainer}>
          <Pressable style={styles.avatarWrapper} onPress={handlePickImage} disabled={isUploading}>
            {avatarUri ? (
              <ExpoImage source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="business" size={48} color={colors.textSecondary} />
              </View>
            )}
            {isUploading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : (
              <View style={[styles.editIconWrapper, { backgroundColor: colors.secondary }]}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 8 }]}>
            Change Business Image
          </Text>
        </View>

        {/* Form Fields */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
            Personal Details
          </Text>

          <Text style={styles.label}>Full Name</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Full Name"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.fullName && <Text style={styles.error}>{errors.fullName.message}</Text>}

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Gender</Text>
              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.genderRow}>
                    {['Male', 'Female', 'Other'].map((item) => (
                      <Pressable
                        key={item}
                        style={[
                          styles.genderButton,
                          { borderColor: colors.border },
                          value === item && { backgroundColor: colors.secondary, borderColor: colors.secondary },
                        ]}
                        onPress={() => onChange(item)}
                      >
                        <Text
                          style={[
                            typography.bodySmall,
                            { color: colors.text },
                            value === item && { color: colors.onSecondary, fontWeight: '700' },
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              />
            </View>
          </View>

          <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ''}
                placeholder="e.g. 1990-01-01"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.dateOfBirth && <Text style={styles.error}>{errors.dateOfBirth.message}</Text>}

          <Text style={styles.label}>Languages Spoken</Text>
          <Controller
            control={control}
            name="language"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g. English, Hindi"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.language && <Text style={styles.error}>{errors.language.message}</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
            Business Details
          </Text>

          <Text style={styles.label}>Business / Professional Name</Text>
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Business Name"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.businessName && <Text style={styles.error}>{errors.businessName.message}</Text>}

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Experience (Years)</Text>
              <Controller
                control={control}
                name="experience"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value)}
                    placeholder="e.g. 5"
                    keyboardType="number-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                )}
              />
              {errors.experience && <Text style={styles.error}>{errors.experience.message}</Text>}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Working Radius (km)</Text>
              <Controller
                control={control}
                name="workingRadius"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value)}
                    placeholder="e.g. 15"
                    keyboardType="number-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                )}
              />
              {errors.workingRadius && <Text style={styles.error}>{errors.workingRadius.message}</Text>}
            </View>
          </View>

          <Text style={styles.label}>About / Professional Bio</Text>
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ''}
                placeholder="Write a brief overview of your business..."
                multiline
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.bio && <Text style={styles.error}>{errors.bio.message}</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
            Emergency Contact
          </Text>

          <Text style={styles.label}>Contact Person Name</Text>
          <Controller
            control={control}
            name="emergencyContact.name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Name"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.emergencyContact?.name && <Text style={styles.error}>{errors.emergencyContact.name.message}</Text>}

          <Text style={styles.label}>Phone Number</Text>
          <Controller
            control={control}
            name="emergencyContact.phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Phone"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.emergencyContact?.phone && <Text style={styles.error}>{errors.emergencyContact.phone.message}</Text>}

          <Text style={styles.label}>Relationship</Text>
          <Controller
            control={control}
            name="emergencyContact.relationship"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g. Spouse, Brother"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.emergencyContact?.relationship && <Text style={styles.error}>{errors.emergencyContact.relationship.message}</Text>}
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, { backgroundColor: colors.secondary }]}
          onPress={handleSubmit(onSubmit)}
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator color={colors.onSecondary} />
          ) : (
            <Text style={[typography.buttonText, { color: colors.onSecondary }]}>
              {profile ? 'Save Provider Details' : 'Complete Provider Profile'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    position: 'absolute',
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  twoCol: { flexDirection: 'row', gap: 12 },
  error: { color: '#EF4444', fontSize: 11, marginTop: 4, fontWeight: '600' },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  genderButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
