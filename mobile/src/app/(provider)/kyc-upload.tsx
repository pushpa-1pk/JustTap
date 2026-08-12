import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { 
  useGetProviderDocuments, 
  useUploadProviderDocument, 
  useDeleteProviderDocument,
  useRequestApproval
} from '@/hooks/useProviderProfile';
import SvgIcon from '@/components/common/SvgIcon';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function KycUploadScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  // Selected document type
  const [selectedDocType, setSelectedDocType] = useState<'aadhar' | 'pan' | 'trade_license' | 'gst' | 'shop_license'>('aadhar');
  const [isUploading, setIsUploading] = useState(false);

  // Queries & Mutations
  const { data: documents, isLoading, refetch } = useGetProviderDocuments();
  const uploadDocMutation = useUploadProviderDocument();
  const deleteDocMutation = useDeleteProviderDocument();
  const requestApprovalMutation = useRequestApproval();

  const handlePickAndUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant library permissions in settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const localUri = result.assets[0].uri;
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsUploading(true);
      
      try {
        // 1. Upload file to Cloudinary
        const cloudinaryRes = await uploadToCloudinary(localUri);
        
        // 2. Upload fileUrl to Profile Service
        await uploadDocMutation.mutateAsync({
          documentType: selectedDocType,
          fileUrl: cloudinaryRes.secure_url,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Verification Uploaded', 'Your document has been uploaded successfully for review.');
        refetch();
      } catch (err: any) {
        console.error('KYC Upload failed:', err);
        Alert.alert('Upload Error', err.response?.data?.message || 'Failed to submit document');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocMutation.mutateAsync(id);
              refetch();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              console.error('Delete document failed:', err);
            }
          }
        }
      ]
    );
  };

  const handleRequestApproval = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await requestApprovalMutation.mutateAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Review Requested', 'Your profile details and documents have been sent to admins for review.');
    } catch (err: any) {
      console.error('Request approval failed:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to request approval.');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { bg: colors.secondary + '15', text: colors.secondary, icon: 'shield-checkmark' };
      case 'rejected':
        return { bg: colors.danger + '15', text: colors.danger, icon: 'alert-circle' };
      case 'under_review':
        return { bg: colors.warning + '15', text: colors.warning, icon: 'time' };
      default:
        return { bg: colors.textSecondary + '15', text: colors.textSecondary, icon: 'ellipse' };
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <>
            {/* Form Selection card */}
            <View style={[styles.cardForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>Verify Credentials</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
                Choose a document type, select your file, and upload to verify your account credentials.
              </Text>

              {/* Selector types */}
              <View style={styles.pickerContainer}>
                {(['aadhar', 'pan', 'trade_license', 'gst', 'shop_license'] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.pickerBtn,
                      { borderColor: colors.border },
                      selectedDocType === type && { backgroundColor: colors.secondary, borderColor: colors.secondary }
                    ]}
                    onPress={() => setSelectedDocType(type)}
                  >
                    <Text style={[
                      typography.bodySmall,
                      { color: colors.text },
                      selectedDocType === type && { color: colors.onSecondary, fontWeight: '700' }
                    ]}>
                      {type.toUpperCase().replace('_', ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable 
                style={[styles.uploadBtn, { backgroundColor: colors.secondary }]}
                onPress={handlePickAndUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color={colors.onSecondary} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={18} color={colors.onSecondary} style={{ marginRight: 8 }} />
                    <Text style={[typography.buttonText, { color: colors.onSecondary }]}>Pick & Upload Document</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Request review banner */}
            {documents && documents.length > 0 && (
              <Pressable 
                style={[styles.reviewBtn, { backgroundColor: colors.text }]}
                onPress={handleRequestApproval}
                disabled={requestApprovalMutation.isPending}
              >
                {requestApprovalMutation.isPending ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <>
                    <Ionicons name="checkbox" size={18} color={colors.surface} style={{ marginRight: 8 }} />
                    <Text style={[typography.buttonText, { color: colors.surface }]}>Submit Profile for Verification Review</Text>
                  </>
                )}
              </Pressable>
            )}

            <Text style={[typography.h3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
              Uploaded Documents ({documents?.length || 0})
            </Text>
          </>
        }
        renderItem={({ item }) => {
          const status = getStatusStyle(item.status);
          return (
            <View style={[styles.docCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.docHeader}>
                <Ionicons name="document-text" size={24} color={colors.textSecondary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
                    {item.documentType.toUpperCase().replace('_', ' ')}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    Uploaded: {new Date(item.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable onPress={() => handleDelete(item._id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              </View>

              {/* Status indicator row */}
              <View style={styles.statusRow}>
                <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon as any} size={12} color={status.text} />
                  <Text style={[styles.statusText, { color: status.text }]}>{item.status.toUpperCase()}</Text>
                </View>
                {item.rejectionReason ? (
                  <Text style={[typography.caption, { color: colors.danger, flex: 1, marginLeft: 10 }]} numberOfLines={2}>
                    Reason: {item.rejectionReason}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 60 },
  cardForm: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  pickerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  uploadBtn: {
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  reviewBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  docCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
  },
});
