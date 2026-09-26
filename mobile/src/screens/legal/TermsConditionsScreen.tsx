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
    title: '1. Acceptance of Terms',
    body:
      'By creating an account or using Vepari AI, you agree to these Terms & Conditions. If you do not agree, do not use the app. These terms are governed by the laws of India.',
  },
  {
    title: '2. Eligibility',
    body:
      'You must be at least 18 years old and have the legal authority to operate a business in India. By using Vepari AI, you confirm you meet these requirements.',
  },
  {
    title: '3. Your Account',
    body:
      'You are responsible for keeping your OTP-authenticated account secure. You must not share your phone number or allow others to access your account. Notify us immediately at vepariai@gmail.com if you suspect unauthorised access.',
  },
  {
    title: '4. Permitted Use',
    body:
      'Vepari AI is for legitimate business record-keeping and financial management. You must not:\n• Enter false, misleading, or fraudulent transaction data.\n• Attempt to reverse-engineer, scrape, or abuse the API.\n• Use the app to evade taxes or engage in financial fraud.\n• Attempt to access other users\' data.',
  },
  {
    title: '5. Financial Data Accuracy',
    body:
      'Vepari AI is a record-keeping and intelligence tool, not a substitute for professional accounting or tax advice. You are solely responsible for the accuracy of data you enter and for meeting your GST, income tax, and other statutory obligations. We do not guarantee the accuracy of AI-generated summaries or suggestions.',
  },
  {
    title: '6. Subscription and Billing',
    body:
      "Where applicable, subscription fees are charged in advance. Refunds are provided at our discretion for unused periods. We will give 30 days' notice before changing pricing. Prices are in Indian Rupees (INR) and include GST where applicable.",
  },
  {
    title: '7. Data Ownership',
    body:
      'You own all business data you enter into Vepari AI. We do not claim ownership over your transaction records, customer data, or business information. You may export or delete your data at any time.',
  },
  {
    title: '8. AI Features Disclaimer',
    body:
      'AI-generated insights, summaries, and suggestions are for informational purposes only. They are not financial, legal, or tax advice. Always verify important decisions with a qualified professional.',
  },
  {
    title: '9. Service Availability',
    body:
      'We aim for high availability but do not guarantee uninterrupted service. The app is designed to work offline; cloud sync depends on internet connectivity. We are not liable for data loss due to device failure — maintain your own backups.',
  },
  {
    title: '10. Limitation of Liability',
    body:
      'To the maximum extent permitted by Indian law, Vepari Technologies is not liable for indirect, consequential, or incidental damages arising from use of the app. Our total liability is limited to the subscription fees you paid in the 12 months preceding any claim.',
  },
  {
    title: '11. Termination',
    body:
      'You may delete your account at any time. We may suspend or terminate accounts that violate these terms. Upon termination, your data will be deleted within 30 days subject to legal obligations.',
  },
  {
    title: '12. Governing Law and Disputes',
    body:
      'These terms are governed by the laws of India. Any disputes will first be attempted to be resolved by mediation. If unresolved, disputes shall be subject to the jurisdiction of the courts of Bangalore, Karnataka.',
  },
  {
    title: '13. Changes to Terms',
    body:
      'We will notify you in-app before material changes take effect. Continued use after notification constitutes acceptance of the updated terms.',
  },
  {
    title: '14. Contact',
    body: 'For any queries about these terms: vepariai@gmail.com\nResponse time: within 5 business days.',
  },
];

export default function TermsConditionsScreen(): React.JSX.Element {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Please read these Terms & Conditions carefully before using Vepari AI.
          Last updated: {LAST_UPDATED}.
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
