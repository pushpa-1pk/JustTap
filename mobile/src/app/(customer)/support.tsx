import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  useGetFAQs,
  useGetSupportTickets,
  useCreateSupportTicket,
} from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';

export default function SupportScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const { data: faqs = [], isLoading: isFaqsLoading } = useGetFAQs();
  const { data: tickets = [], isLoading: isTicketsLoading, refetch: refetchTickets } = useGetSupportTickets();
  const createTicketMutation = useCreateSupportTicket();

  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'BILLING' | 'BOOKING' | 'TECHNICAL' | 'OTHER'>('BOOKING');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCallSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('tel:+18001234567');
  };

  const handleLiveChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(customer)/(tabs)/messages');
  };

  const handleRaiseTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Incomplete Form', 'Please provide a subject and detailed description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTicketMutation.mutateAsync({
        subject: subject.trim(),
        description: description.trim(),
        category,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubject('');
      setDescription('');
      setCategory('BOOKING');
      setModalVisible(false);
      refetchTickets();
      Alert.alert('Ticket Raised', 'Our support team will review your ticket and respond shortly.');
    } catch (err: any) {
      console.error('Failed to raise ticket:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err?.message || 'Could not raise ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isFaqsLoading || isTicketsLoading;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Quick Contact buttons */}
        <View style={styles.quickContactRow}>
          <Pressable onPress={handleLiveChat} style={[styles.contactCard, { borderColor: colors.border }]}>
            <Ionicons name="chatbubbles-outline" size={26} color={colors.primary} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>Live Chat</Text>
            <Text style={[styles.contactSub, { color: colors.textSecondary }]}>Chat with support</Text>
          </Pressable>

          <Pressable onPress={handleCallSupport} style={[styles.contactCard, { borderColor: colors.border }]}>
            <Ionicons name="call-outline" size={26} color={colors.primary} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>Call Support</Text>
            <Text style={[styles.contactSub, { color: colors.textSecondary }]}>Toll-free 24/7</Text>
          </Pressable>
        </View>

        {/* FAQs Accordion */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
        <View style={[styles.faqList, { borderColor: colors.border }]}>
          {faqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <View key={faq.id} style={[styles.faqRow, { borderBottomColor: colors.border }]}>
                <Pressable onPress={() => toggleFaq(faq.id)} style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.text}
                  />
                </Pressable>
                {isExpanded && (
                  <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                    {faq.answer}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Support Tickets Section */}
        <View style={styles.ticketSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Support Tickets</Text>
          <Pressable onPress={() => setModalVisible(true)} style={[styles.raiseBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.raiseBtnText}>Raise Ticket</Text>
          </Pressable>
        </View>

        {tickets.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tickets raised yet.
          </Text>
        ) : (
          <View style={styles.ticketList}>
            {tickets.map((t) => (
              <View key={t._id} style={[styles.ticketCard, { borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.ticketSubject, { color: colors.text }]}>{t.subject}</Text>
                    <Text style={[styles.ticketCategory, { color: colors.textSecondary }]}>
                      ({t.category})
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          t.status === 'RESOLVED' || t.status === 'CLOSED'
                            ? '#16A34A15'
                            : '#D9770615',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            t.status === 'RESOLVED' || t.status === 'CLOSED'
                              ? '#16A34A'
                              : '#D97706',
                        },
                      ]}
                    >
                      {t.status}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.ticketDesc, { color: colors.textSecondary }]}>
                  {t.description}
                </Text>
                <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>
                  Opened on {new Date(t.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Raise Ticket Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Support Ticket</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#111111" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalLabel}>Category *</Text>
              <View style={styles.labelPicker}>
                {(['BILLING', 'BOOKING', 'TECHNICAL', 'OTHER'] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.pickerBtn,
                      category === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.pickerText, category === cat && { color: '#FFFFFF' }]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>Subject *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Brief summary of the issue"
                value={subject}
                onChangeText={subject => setSubject(subject)}
              />

              <Text style={styles.modalLabel}>Description *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Explain the issue in detail"
                multiline={true}
                numberOfLines={4}
                value={description}
                onChangeText={description => setDescription(description)}
              />

              <Pressable
                onPress={handleRaiseTicket}
                disabled={isSubmitting}
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Ticket</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { padding: 4 },
  quickContactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
  },
  contactSub: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  faqList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 28,
  },
  faqRow: {
    borderBottomWidth: 1,
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    lineHeight: 18,
  },
  ticketSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  raiseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  raiseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  ticketList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '900',
  },
  ticketCategory: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketDesc: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  ticketDate: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111111',
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 6,
    marginTop: 10,
  },
  labelPicker: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  pickerBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666666',
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    color: '#111111',
    fontSize: 15,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
