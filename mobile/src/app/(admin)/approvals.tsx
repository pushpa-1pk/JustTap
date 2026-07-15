import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { 
  useGetPendingApprovalsQuery, 
  useApproveProviderMutation, 
  useRejectProviderMutation 
} from '@/redux/api/adminApi';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function AdminApprovalsScreen() {
  const { colors, typography, spacing, border } = useTheme();
  
  // API Queries & Mutations
  const { data: approvalsRes, isLoading, refetch } = useGetPendingApprovalsQuery();
  const [approveProvider, { isLoading: isApproving }] = useApproveProviderMutation();
  const [rejectProvider, { isLoading: isRejecting }] = useRejectProviderMutation();

  const approvals = approvalsRes?.data || [];

  // Reject remarks modal states
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  const handleApprove = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const response = await approveProvider(id).unwrap();
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Approved', 'Provider has been verified and marked active!');
        refetch();
      }
    } catch (err) {
      console.error('Approve provider failed:', err);
    }
  };

  const handleRejectClick = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRequestId(id);
    setRemarks('');
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!selectedRequestId) return;
    if (remarks.trim() === '') {
      Alert.alert('Remarks Required', 'Please input rejection reasons for the provider.');
      return;
    }

    try {
      const response = await rejectProvider({
        requestId: selectedRequestId,
        remarks,
      }).unwrap();

      if (response.success) {
        setRejectModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Rejected', 'Provider verification has been rejected.');
        refetch();
      }
    } catch (err) {
      console.error('Reject provider failed:', err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : approvals.length === 0 ? (
        <View style={styles.center}>
          <SvgIcon name="briefcase" color={colors.secondary} size={48} />
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>
            All Set!
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
            No pending service provider registration requests are awaiting review.
          </Text>
        </View>
      ) : (
        <FlatList
          data={approvals}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>REQUEST ID: {item._id}</Text>
              <Text style={[typography.h3, { color: colors.text, marginTop: 4, fontWeight: '700' }]}>
                {item.businessName}
              </Text>
              
              <View style={styles.detailsRow}>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                  Experience: <Text style={{ color: colors.text, fontWeight: '600' }}>{item.experience} Years</Text>
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                  Radius: <Text style={{ color: colors.text, fontWeight: '600' }}>{item.workingRadius} km</Text>
                </Text>
              </View>

              <View style={[styles.btnRow, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}>
                <Pressable
                  style={[styles.rejectBtn, { borderColor: colors.danger, borderWidth: 1 }]}
                  onPress={() => handleRejectClick(item._id)}
                  disabled={isRejecting}
                >
                  <Text style={[typography.buttonText, { color: colors.danger, fontSize: 13 }]}>Reject</Text>
                </Pressable>

                <Pressable
                  style={[styles.approveBtn, { backgroundColor: colors.secondary }]}
                  onPress={() => handleApprove(item._id)}
                  disabled={isApproving}
                >
                  {isApproving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[typography.buttonText, { color: '#FFFFFF', fontSize: 13 }]}>Verify & Approve</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* REJECTION MODAL */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Rejection remarks</Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: spacing.md }]}>
              Please explain why this registration is being rejected (e.g. invalid docs):
            </Text>

            <TextInput
              style={[styles.textInput, typography.bodyMedium, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="e.g. Aadhar card is blur, Bank account mismatch"
              placeholderTextColor={colors.textSecondary}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setRejectModalVisible(false)}>
                <Text style={[typography.buttonText, { color: colors.textSecondary }]}>Dismiss</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalConfirmBtn, { backgroundColor: colors.danger }]} 
                onPress={handleRejectSubmit}
              >
                <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Submit Reject</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  list: {
    padding: 24,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
  },
  rejectBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    flex: 2,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
  },
  textInput: {
    height: 80,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalConfirmBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
