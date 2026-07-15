import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import axios from 'axios';
import { getAbsoluteUrl } from '@/config/axios';
import { secureStore } from '@/utils/secureStore';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

interface KYCConfig {
  _id: string;
  documentType: 'aadhar' | 'pan' | 'profile_photo' | 'trade_license' | 'gst' | 'shop_license';
  fileUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  adminRemarks?: string;
  createdAt: string;
}

export default function KycUploadScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();

  // Documents list states
  const [documents, setDocuments] = useState<KYCConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<'aadhar' | 'pan' | 'trade_license'>('aadhar');

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const token = await secureStore.getAccessToken();
      const docUrl = getAbsoluteUrl('/documents');
      const response = await axios.get(docUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setDocuments(response.data.data);
      }
    } catch (err) {
      console.warn('Fetch documents failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSimulatedUpload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsUploading(true);
    try {
      const token = await secureStore.getAccessToken();
      const uploadUrl = getAbsoluteUrl('/documents/upload');

      // The backend expects documentType and fileUrl or multipart file
      const response = await axios.post(
        uploadUrl,
        {
          documentType: selectedDocType,
          fileUrl: `https://justtap-payouts.s3.amazonaws.com/kyc/${selectedDocType}_mock_file.jpg`,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Verification Uploaded', 'Our admin panel will review your document shortly.');
        fetchDocuments();
      }
    } catch (err: any) {
      console.error('KYC Upload failed:', err);
      Alert.alert('Upload Error', err.response?.data?.message || 'Failed to submit document');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return { bg: colors.secondary + '15', text: colors.secondary };
      case 'REJECTED':
        return { bg: colors.danger + '15', text: colors.danger };
      default:
        return { bg: colors.warning + '15', text: colors.warning };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.lg }]}>
      
      {/* Selector input card */}
      <View style={[styles.cardForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Verify Identity</Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          Upload a clear photograph of your ID document.
        </Text>

        <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary }]}>CHOOSE DOCUMENT TYPE</Text>
        <View style={styles.pickerRow}>
          {(['aadhar', 'pan', 'trade_license'] as const).map((type) => (
            <Pressable
              key={type}
              style={[
                styles.pickerItem,
                { 
                  backgroundColor: selectedDocType === type ? colors.secondary : colors.surfaceVariant,
                  borderColor: selectedDocType === type ? colors.secondary : colors.border
                }
              ]}
              onPress={() => setSelectedDocType(type)}
            >
              <Text style={[
                typography.caption, 
                { color: selectedDocType === type ? '#FFFFFF' : colors.text, fontWeight: '700', textTransform: 'uppercase' }
              ]}>
                {type.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable 
          style={[styles.uploadBtn, { backgroundColor: colors.primary, marginTop: spacing.xl }]}
          onPress={handleSimulatedUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[typography.buttonText, { color: colors.onPrimary }]}>Simulate Photo Capture & Upload</Text>
          )}
        </Pressable>
      </View>

      {/* Uploaded Documents List */}
      <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.lg }]}>
        Verification Status
      </Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 20 }} />
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>No documents uploaded yet.</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: 12, marginTop: 12 }}
          renderItem={({ item }) => {
            const statusStyle = getStatusStyle(item.status);
            return (
              <View style={[styles.docCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.docHeader}>
                  <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700', textTransform: 'uppercase' }]}>
                    📄 {item.documentType.replace('_', ' ')}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[typography.caption, { color: statusStyle.text, fontWeight: '800' }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                {item.adminRemarks && (
                  <Text style={[typography.caption, { color: colors.danger, marginTop: 8 }]}>
                    Remarks: {item.adminRemarks}
                  </Text>
                )}
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6 }]}>
                  Submitted on: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            );
          }}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardForm: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontWeight: '700',
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerItem: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
