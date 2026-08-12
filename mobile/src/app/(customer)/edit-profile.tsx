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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGetCustomerProfile, useUpdateCustomerProfile, useCreateCustomerProfile } from '@/hooks/useProfile';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { useTheme } from '@/hooks/useTheme';
import { useDispatch } from 'react-redux';
import { updateUser } from '@/redux/slices/authSlice';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format'),
  gender: z.enum(['Male', 'Female', 'Other']),
  language: z.string().min(2, 'Language is required'),
  emergencyContact: z.object({
    name: z.string().min(2, 'Contact name is required'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    relationship: z.string().min(2, 'Relationship is required'),
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfileScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const { data, isLoading: isProfileLoading, refetch } = useGetCustomerProfile();
  const updateProfileMutation = useUpdateCustomerProfile();
  const createProfileMutation = useCreateCustomerProfile();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      dateOfBirth: '1998-01-01',
      gender: 'Male',
      language: 'English',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
    },
  });

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setValue('fullName', p.fullName || '');
      setValue('email', p.email || '');
      setValue('gender', (p.gender as 'Male' | 'Female' | 'Other') || 'Male');
      setValue(
        'dateOfBirth',
        p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '1998-01-01'
      );
      setValue('language', p.language || 'English');
      setAvatarUri(p.profileImage || null);

      if (p.emergencyContact) {
        setValue('emergencyContact.name', p.emergencyContact.name || '');
        setValue('emergencyContact.phone', p.emergencyContact.phone || '');
        setValue('emergencyContact.relationship', p.emergencyContact.relationship || '');
      }
    }
  }, [data, setValue]);

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

      // Perform direct Cloudinary upload immediately
      setIsUploading(true);
      try {
        const cloudinaryRes = await uploadToCloudinary(localUri);
        
        // Update profile photo in profile service if profile exists
        if (data?.profile) {
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
        Alert.alert('Success', 'Profile photo updated successfully!');
      } catch (err: any) {
        console.error('Image upload failed:', err);
        Alert.alert('Error', err?.message || 'Failed to upload image to Cloudinary.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const hasProfile = Boolean(data?.profile);
      const payload = {
        ...values,
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
      Alert.alert('Success', 'Profile saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (!hasProfile) {
              router.replace('/(customer)/(tabs)/home');
            } else {
              router.back();
            }
          },
        },
      ]);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err?.message || 'Failed to update profile. Please try again.');
    }
  };

  if (isProfileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isSaving = updateProfileMutation.isPending || isUploading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView style={[styles.container]} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>
          {data?.profile ? 'Edit Profile' : 'Complete Profile'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avatar picker */}
      <View style={styles.avatarSection}>
        <Pressable onPress={handlePickImage} disabled={isSaving}>
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <ExpoImage source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="person" size={50} color={colors.text} />
              </View>
            )}
            {isUploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </View>
        </Pressable>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 8 }]}>
          Tap to change profile picture
        </Text>
      </View>

      {/* Personal Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Personal Information</Text>

        {/* Full Name */}
        <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={value}
              onChangeText={onChange}
              placeholder="Enter full name"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        />
        {errors.fullName && <Text style={styles.error}>{errors.fullName.message}</Text>}

        {/* Email */}
        <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email address"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        />
        {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

        {/* DOB & Gender Row */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.text }]}>Date of Birth</Text>
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
              )}
            />
            {errors.dateOfBirth && <Text style={styles.error}>{errors.dateOfBirth.message}</Text>}
          </View>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View style={styles.genderContainer}>
                  {(['Male', 'Female', 'Other'] as const).map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => onChange(g)}
                      style={[
                        styles.genderOption,
                        { borderColor: colors.border },
                        value === g && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[styles.genderText, { color: value === g ? '#FFFFFF' : colors.text }]}>
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>
        </View>

        {/* Language */}
        <Text style={[styles.label, { color: colors.text }]}>Preferred Language</Text>
        <Controller
          control={control}
          name="language"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={value}
              onChangeText={onChange}
              placeholder="e.g. English"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        />
        {errors.language && <Text style={styles.error}>{errors.language.message}</Text>}
      </View>

      {/* Emergency Contact */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Emergency Contact</Text>

        <Text style={[styles.label, { color: colors.text }]}>Contact Name</Text>
        <Controller
          control={control}
          name="emergencyContact.name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={value}
              onChangeText={onChange}
              placeholder="Enter contact name"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        />
        {errors.emergencyContact?.name && (
          <Text style={styles.error}>{errors.emergencyContact.name.message}</Text>
        )}

        <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
        <Controller
          control={control}
          name="emergencyContact.phone"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              placeholder="Enter contact number"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        />
        {errors.emergencyContact?.phone && (
          <Text style={styles.error}>{errors.emergencyContact.phone.message}</Text>
        )}

        <Text style={[styles.label, { color: colors.text }]}>Relationship</Text>
        <Controller
          control={control}
          name="emergencyContact.relationship"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Spouse, Parent, Friend"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        />
        {errors.emergencyContact?.relationship && (
          <Text style={styles.error}>{errors.emergencyContact.relationship.message}</Text>
        )}
      </View>

      {/* Save Button */}
      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={isSaving}
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: colors.primary },
          pressed && { opacity: 0.8 },
          isSaving && { opacity: 0.5 },
        ]}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            {data?.profile ? 'Save changes' : 'Complete Profile'}
          </Text>
        )}
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  genderOption: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderText: {
    fontSize: 12,
    fontWeight: '800',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '700',
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
