import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface FilterState {
  serviceType: string | null;
  paymentStatus: string | null;
}

interface JobFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilter: FilterState | null;
  onApply: (filter: FilterState | null) => void;
}

export const JobFilterSheet: React.FC<JobFilterSheetProps> = ({
  visible,
  onClose,
  activeFilter,
  onApply,
}) => {
  const { colors, typography } = useTheme();

  const [serviceType, setServiceType] = useState<string | null>(activeFilter?.serviceType || null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(activeFilter?.paymentStatus || null);

  const services = ['All', 'Electrician', 'Plumber', 'Cleaner', 'AC Servicing', 'Appliance Repair'];
  const paymentStates = ['All', 'COMPLETED', 'PENDING', 'FAILED'];

  const handleApply = () => {
    if (serviceType === 'All' && paymentStatus === 'All') {
      onApply(null);
    } else {
      onApply({
        serviceType: serviceType === 'All' ? null : serviceType,
        paymentStatus: paymentStatus === 'All' ? null : paymentStatus,
      });
    }
    onClose();
  };

  const handleClear = () => {
    setServiceType(null);
    setPaymentStatus(null);
    onApply(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.flexPressable} onPress={onClose} />
        
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[typography.h3, styles.title, { color: colors.text }]}>
              Filter Jobs
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Service Type Section */}
            <View style={styles.section}>
              <Text style={[typography.bodyLarge, styles.sectionTitle, { color: colors.text }]}>
                Service Category
              </Text>
              <View style={styles.chipRow}>
                {services.map((item) => {
                  const isSelected = 
                    (item === 'All' && serviceType === null) || 
                    (serviceType === item);
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setServiceType(item === 'All' ? null : item)}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
                      ]}
                    >
                      <Text style={[typography.bodySmall, { color: isSelected ? colors.text : colors.textSecondary, fontWeight: '700' }]}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Payment Status Section */}
            <View style={styles.section}>
              <Text style={[typography.bodyLarge, styles.sectionTitle, { color: colors.text }]}>
                Payment Status
              </Text>
              <View style={styles.chipRow}>
                {paymentStates.map((item) => {
                  const isSelected = 
                    (item === 'All' && paymentStatus === null) || 
                    (paymentStatus === item);
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setPaymentStatus(item === 'All' ? null : item)}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
                      ]}
                    >
                      <Text style={[typography.bodySmall, { color: isSelected ? colors.text : colors.textSecondary, fontWeight: '700' }]}>
                        {item === 'COMPLETED' ? 'Received' : item === 'PENDING' ? 'Pending' : item === 'FAILED' ? 'Failed' : 'All'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleClear}
              style={[styles.btnSecondary, { borderColor: colors.border }]}
            >
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, fontWeight: '700' }]}>
                Clear All
              </Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              style={[styles.btnPrimary, { backgroundColor: colors.secondary }]}
            >
              <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '800' }]}>
                Apply Filters
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  flexPressable: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  btnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondary: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default JobFilterSheet;
