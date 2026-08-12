import React from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetProviderProfile, useGetProviderServices, useGetProviderDocuments } from '@/hooks/useProviderProfile';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function BusinessInfoScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  
  // Queries
  const { data: profile, isLoading: isProfileLoading } = useGetProviderProfile();
  const { data: services, isLoading: isServicesLoading } = useGetProviderServices();
  const { data: documents, isLoading: isDocsLoading } = useGetProviderDocuments();

  const isLoading = isProfileLoading || isServicesLoading || isDocsLoading;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  // Extract categories, subcategories, and skills from services offered
  const categories = Array.from(new Set(services?.map(s => s.serviceDetails?.categoryName).filter(Boolean) || []));
  const subCategories = Array.from(new Set(services?.map(s => s.serviceDetails?.name).filter(Boolean) || []));
  const skills = Array.from(new Set([
    ...(profile?.bio?.split(',').map(s => s.trim()).filter(s => s.length > 2 && s.length < 20) || []),
    ...categories,
    ...subCategories
  ]));

  // Document numbers if they were verified (mocked or from file name / details)
  const gstDoc = documents?.find(d => d.documentType === 'gst');
  const tradeDoc = documents?.find(d => d.documentType === 'trade_license');
  const shopDoc = documents?.find(d => d.documentType === 'shop_license');

  const gstStatus = gstDoc ? gstDoc.status.toUpperCase() : 'NOT PROVIDED';
  const licenseStatus = tradeDoc ? tradeDoc.status.toUpperCase() : 'NOT PROVIDED';
  const registrationStatus = shopDoc ? shopDoc.status.toUpperCase() : 'NOT PROVIDED';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      {/* Verification Status Banner */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[typography.h3, { color: colors.text }]}>Verification Status</Text>
          <View style={[
            styles.statusPill, 
            { 
              backgroundColor: 
                profile?.verificationStatus === 'approved' ? colors.secondary + '15' : 
                profile?.verificationStatus === 'rejected' ? colors.danger + '15' : colors.warning + '15' 
            }
          ]}>
            <Text style={[
              typography.caption, 
              { 
                color: 
                  profile?.verificationStatus === 'approved' ? colors.secondary : 
                  profile?.verificationStatus === 'rejected' ? colors.danger : colors.warning, 
                fontWeight: '800' 
              }
            ]}>
              {profile?.verificationStatus?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 6 }]}>
          {profile?.verificationStatus === 'approved' 
            ? 'Your business profile is fully verified and you are eligible to receive customer booking dispatch calls.'
            : 'Your credentials are under verification review. Once approved, you can toggle online and receive jobs.'}
        </Text>
      </View>

      {/* Business Details Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Corporate Details</Text>
        
        <View style={styles.infoRow}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Business Name</Text>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{profile?.businessName || 'Apex Service Providers'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Years of Experience</Text>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{profile?.experience || 0} Years</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>GST Number</Text>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
            {gstDoc ? 'GST-99281390-A' : 'Not Uploaded'}
          </Text>
        </View>
        <Text style={styles.docStatus}>Document Status: <Text style={{fontWeight: '700'}}>{gstStatus}</Text></Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Business Registration</Text>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
            {shopDoc ? 'REG-MUM-89201' : 'Not Uploaded'}
          </Text>
        </View>
        <Text style={styles.docStatus}>Document Status: <Text style={{fontWeight: '700'}}>{registrationStatus}</Text></Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Trade License Number</Text>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
            {tradeDoc ? 'LIC-PLUMB-77402' : 'Not Uploaded'}
          </Text>
        </View>
        <Text style={styles.docStatus}>Document Status: <Text style={{fontWeight: '700'}}>{licenseStatus}</Text></Text>
      </View>

      {/* Service Catalog Details */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Service Scope</Text>
        
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: 8, fontWeight: '600' }]}>Service Categories</Text>
        {categories.length > 0 ? (
          <View style={styles.pillContainer}>
            {categories.map((cat, idx) => (
              <View key={idx} style={[styles.pill, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[typography.bodySmall, { color: colors.text }]}>{cat}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>No categories configured. Go to Service Management to configure offered services.</Text>
        )}

        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 12, marginBottom: 8, fontWeight: '600' }]}>Sub Categories</Text>
        {subCategories.length > 0 ? (
          <View style={styles.pillContainer}>
            {subCategories.map((sub, idx) => (
              <View key={idx} style={[styles.pill, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[typography.bodySmall, { color: colors.text }]}>{sub}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>No sub-categories configured.</Text>
        )}

        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 12, marginBottom: 8, fontWeight: '600' }]}>Verified Skills</Text>
        {skills.length > 0 ? (
          <View style={styles.pillContainer}>
            {skills.map((skill, idx) => (
              <View key={idx} style={[styles.pill, { backgroundColor: colors.secondary + '10', borderColor: colors.secondary, borderWidth: 1 }]}>
                <Text style={[typography.bodySmall, { color: colors.secondary, fontWeight: '700' }]}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>No skills tags listed.</Text>
        )}
      </View>

      {/* Button to Upload Documents */}
      <Pressable 
        style={[styles.btn, { backgroundColor: colors.secondary }]}
        onPress={() => router.push('/(provider)/kyc-upload')}
      >
        <Ionicons name="document-text" size={18} color={colors.onSecondary} style={{ marginRight: 8 }} />
        <Text style={[typography.buttonText, { color: colors.onSecondary }]}>Manage Identity Documents</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  docStatus: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
    marginTop: -2,
    marginBottom: 6,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
