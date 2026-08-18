import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '@/utils/cloudinary';
import {
  useGetProviderDocuments,
  useUploadProviderDocument,
  useDeleteProviderDocument,
  useRequestApproval,
  useGetKycRequirements,
  type KycRequirement,
} from '@/hooks/useProviderProfile';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type DocType = 'aadhar' | 'pan' | 'profile_photo' | 'trade_license' | 'gst' | 'shop_license';

export default function KycUploadScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ resubmit?: string }>();
  const isResubmit = params.resubmit === 'true';

  const [selectedDocType, setSelectedDocType] = useState<DocType>('aadhar');
  const [isUploading, setIsUploading] = useState(false);

  // Queries & Mutations
  const { data: requirements, isLoading: isReqLoading } = useGetKycRequirements();
  const { data: documents, isLoading: isDocsLoading, refetch } = useGetProviderDocuments();
  const uploadDocMutation = useUploadProviderDocument();
  const deleteDocMutation = useDeleteProviderDocument();
  const requestApprovalMutation = useRequestApproval();

  const isLoading = isReqLoading || isDocsLoading;

  // For resubmit mode, only show requirements where the uploaded doc was rejected
  const visibleRequirements: KycRequirement[] = isResubmit
    ? (requirements || []).filter((req) => {
        const uploaded = documents?.find(d => d.documentType === req.documentType);
        return uploaded?.status === 'rejected';
      })
    : (requirements || []);

  const getUploadedDoc = (docType: string) =>
    documents?.find(d => d.documentType === docType);

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
        const cloudinaryRes = await uploadToCloudinary(localUri);
        await uploadDocMutation.mutateAsync({
          documentType: selectedDocType,
          fileUrl: cloudinaryRes.secure_url,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Uploaded', 'Your document has been submitted for review.');
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
      Alert.alert(
        'Submitted for Review',
        'Your profile and documents have been sent to admins for verification.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error('Request approval failed:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to request approval.');
    }
  };

  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { bg: colors.secondary + '18', text: colors.secondary, icon: 'shield-checkmark' as const };
      case 'rejected':
        return { bg: colors.danger + '18', text: colors.danger, icon: 'alert-circle' as const };
      case 'under_review':
        return { bg: colors.warning + '18', text: colors.warning, icon: 'time' as const };
      default:
        return { bg: colors.textSecondary + '18', text: colors.textSecondary, icon: 'ellipse' as const };
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  const hasRequiredDocs = (requirements || [])
    .filter(r => r.isRequired)
    .every(r => {
      const doc = getUploadedDoc(r.documentType);
      return doc && doc.status !== 'rejected';
    });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={visibleRequirements}
        keyExtractor={(item) => item.documentType}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <>
            {isResubmit && (
              <View style={[styles.resubmitBanner, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
                <Ionicons name="warning" size={18} color={colors.danger} />
                <Text style={[typography.bodySmall, { color: colors.danger, marginLeft: 8, flex: 1 }]}>
                  Re-upload only the rejected documents below. Approved documents don't need re-submission.
                </Text>
              </View>
            )}

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.h3, { color: colors.text, marginBottom: 4 }]}>
                {isResubmit ? 'Re-upload Rejected Documents' : 'Upload Verification Documents'}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 14 }]}>
                Select a document type, then pick a file to upload.
              </Text>

              {/* Dynamic type selector from backend */}
              <View style={styles.picker}>
                {visibleRequirements.map((req) => {
                  const isSelected = selectedDocType === req.documentType;
                  return (
                    <Pressable
                      key={req.documentType}
                      style={[
                        styles.pickerBtn,
                        { borderColor: colors.border },
                        isSelected && { backgroundColor: colors.secondary, borderColor: colors.secondary }
                      ]}
                      onPress={() => setSelectedDocType(req.documentType as DocType)}
                    >
                      <Text style={[
                        typography.bodySmall,
                        { color: isSelected ? colors.onSecondary : colors.text },
                        isSelected && { fontWeight: '700' }
                      ]}>
                        {req.label}{req.isRequired ? ' *' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Description of selected type */}
              {(() => {
                const selectedReq = visibleRequirements.find(r => r.documentType === selectedDocType);
                if (!selectedReq) return null;
                return (
                  <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
                    {selectedReq.description}
                  </Text>
                );
              })()}

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
                    <Text style={[typography.buttonText, { color: colors.onSecondary }]}>
                      Pick & Upload
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {hasRequiredDocs && (
              <Pressable
                style={[styles.submitBtn, { backgroundColor: colors.text }]}
                onPress={handleRequestApproval}
                disabled={requestApprovalMutation.isPending}
              >
                {requestApprovalMutation.isPending ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <>
                    <Ionicons name="checkbox" size={18} color={colors.surface} style={{ marginRight: 8 }} />
                    <Text style={[typography.buttonText, { color: colors.surface }]}>
                      Submit for Verification Review
                    </Text>
                  </>
                )}
              </Pressable>
            )}

            <Text style={[typography.h3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>
              Document Status ({visibleRequirements.length})
            </Text>
          </>
        }
        renderItem={({ item: req }) => {
          const doc = getUploadedDoc(req.documentType);
          const statusStyle = getStatusStyle(doc?.status);
          return (
            <View style={[styles.docCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.docHeader}>
                <View style={[styles.docIconWrapper, { backgroundColor: statusStyle.bg }]}>
                  <Ionicons name="document-text" size={20} color={statusStyle.text} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
                    {req.label}
                    {req.isRequired && <Text style={{ color: colors.danger }}> *</Text>}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {doc
                      ? `Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Not yet uploaded'}
                  </Text>
                </View>
                {doc && (
                  <Pressable onPress={() => handleDelete(doc._id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                )}
              </View>

              <View style={styles.statusRow}>
                <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                  <Ionicons name={statusStyle.icon} size={11} color={statusStyle.text} />
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {doc ? doc.status.toUpperCase().replace('_', ' ') : (req.isRequired ? 'REQUIRED' : 'OPTIONAL')}
                  </Text>
                </View>
                {doc?.rejectionReason ? (
                  <Text style={[typography.caption, { color: colors.danger, flex: 1, marginLeft: 10, lineHeight: 16 }]}>
                    {doc.rejectionReason}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { padding: 20, paddingBottom: 60 },
  resubmitBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pickerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  uploadBtn: {
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtn: {
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
  docIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
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

