import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '@vepari/design-system';

const LAST_UPDATED = '1 September 2025';

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: '1. Who We Are',
    body:
      'Vepari AI is operated by Vepari Technologies (contact: vepariai@gmail.com). We build AI-powered business intelligence tools for micro, small, and medium enterprises (MSMEs) across India.',
  },
  {
    title: '2. Data We Collect',
    body:
      'We collect:\n• Account data: phone number, name, business name and type.\n• Transaction data: sales, purchases, expenses, payments, inventory records you enter.\n• Voice recordings: when you use voice input, audio is sent to our server and transcribed. Recordings are deleted immediately after transcription.\n• Device data: device model, OS version, and crash logs for support purposes.\n• Usage analytics: feature interactions (no personally identifiable information).',
  },
  {
    title: '3. Why We Collect It',
    body:
      "We use your data to:\n• Provide the app's core accounting and AI features.\n• Sync your records across devices.\n• Send alerts and notifications you configure.\n• Improve accuracy of AI models (using anonymised, aggregated data only).\n• Comply with applicable Indian laws (GST, income tax records).",
  },
  {
    title: '4. Data Minimisation',
    body:
      'We only collect data required for the features you use. Voice recordings are never stored beyond the transcription step. You can delete your account and all associated data at any time from More → Settings → Delete Account.',
  },
  {
    title: '5. Data Sharing',
    body:
      'We do not sell your data. We share data only with:\n• Sarvam AI (voice transcription, server-side only — no audio stored by Sarvam).\n• Cloud infrastructure providers (encrypted at rest and in transit).\n• Regulatory authorities if legally compelled.',
  },
  {
    title: '6. Data Security',
    body:
      'All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). Passwords are never stored — we use OTP-based authentication. Access tokens expire after 15 minutes. API keys and secrets are never included in the mobile app.',
  },
  {
    title: '7. Data Retention',
    body:
      'Transaction records are retained for 7 years (as required by Indian tax law). Account data is deleted within 30 days of an account deletion request, subject to legal obligations.',
  },
  {
    title: '8. Your Rights',
    body:
      'You have the right to:\n• Access all data we hold about you.\n• Correct inaccurate data.\n• Request deletion of your account and data.\n• Export your data in a machine-readable format.\nContact us at vepariai@gmail.com to exercise any of these rights.',
  },
  {
    title: '9. Children',
    body:
      'Vepari AI is not intended for users under 18 years of age. We do not knowingly collect data from minors.',
  },
  {
    title: '10. Changes to This Policy',
    body:
      'We will notify you in-app before making material changes to this policy. Continued use of the app after notification constitutes acceptance.',
  },
  {
    title: '11. Contact',
    body: 'For privacy enquiries: vepariai@gmail.com\nResponse time: within 5 business days.',
  },
];

export default function PrivacyPolicyScreen(): React.JSX.Element {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          This Privacy Policy explains how Vepari AI collects, uses, and protects your personal
          information. Last updated: {LAST_UPDATED}.
        </Text>

        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          © {new Date().getFullYear()} Vepari Technologies. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.ivory,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing[1],
  },
  backArrow: {
    fontSize: Typography.fontSize.xl,
    color: Colors.gold,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.brown,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.lg,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  intro: {
    color: Colors.muted,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * 1.7,
    marginBottom: Spacing[6],
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    color: Colors.gold,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing[2],
  },
  sectionBody: {
    color: Colors.brown,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * 1.7,
  },
  footer: {
    color: Colors.dim,
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    marginTop: Spacing[8],
  },
});
