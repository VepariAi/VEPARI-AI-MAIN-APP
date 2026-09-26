import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '@vepari/design-system';

const SECTIONS = [
  {
    title: '1. About This Policy',
    body: 'Vepari AI is a native mobile application and does not use browser cookies. This policy explains the equivalent tracking technologies we use on mobile devices — specifically local storage and analytics SDKs — and how you can control them.',
  },
  {
    title: '2. What We Store Locally',
    body: 'We store data on your device using SQLite (offline ledger) and AsyncStorage (session tokens, preferences). This data is:\n• Necessary to operate the app offline.\n• Never shared with third parties without your consent.\n• Cleared when you uninstall the app or delete your account.',
  },
  {
    title: '3. Analytics',
    body: 'If you have granted analytics permission, we may collect aggregated, anonymised usage events (screens visited, feature tap counts) to improve the app. We do not collect personally identifiable information in analytics events. You can opt out at any time under More → Settings → Privacy.',
  },
  {
    title: '4. Crash Reporting',
    body: 'With your consent, crash reports (stack traces and device model information) may be sent to our error-monitoring service (Sentry) to help us fix bugs. No personal data or financial data is included in crash reports.',
  },
  {
    title: '5. Third-Party SDKs',
    body: 'Vepari AI uses the following third-party SDKs that may access device identifiers:\n• Sarvam AI SDK — voice transcription (server-side only; audio is not stored)\n• Firebase Cloud Messaging — push notification delivery\n\nThese SDKs do not receive financial data from your ledger.',
  },
  {
    title: '6. Your Controls',
    body: 'You can:\n• Revoke analytics consent: More → Settings → Privacy.\n• Revoke push notifications: device system settings.\n• Delete all local data: More → Settings → Delete Account.\n• Request full data erasure: email vepariai@gmail.com.',
  },
  {
    title: '7. Children',
    body: 'Vepari AI is not directed at children under the age of 18. We do not knowingly collect data from minors.',
  },
  {
    title: '8. Updates to This Policy',
    body: 'We may update this policy when we add or remove tracking technologies. We will notify you in-app for material changes. Continued use after notification constitutes acceptance.',
  },
  {
    title: '9. Contact',
    body: 'For questions about data tracking: vepariai@gmail.com\nResponse time: within 5 business days.',
  },
];

export default function CookiePolicyScreen(): React.JSX.Element {
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
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Cookie & Tracking Policy</Text>
        <Text style={styles.updated}>Last updated: 1 September 2025</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          This policy explains how Vepari AI uses local storage and analytics technologies in our mobile application.
        </Text>

        {SECTIONS.map(s => (
          <View key={s.title} style={styles.section} accessible accessibilityLabel={s.title}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Vepari Technologies · vepariai@gmail.com</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    backgroundColor: Colors.brown,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[6],
  },
  backBtn: { marginBottom: Spacing[3] },
  backText: { color: Colors.gold, fontSize: Typography.fontSize.sm },
  heading: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.ivory,
    marginBottom: Spacing[1],
  },
  updated: { fontSize: Typography.fontSize.xs, color: Colors.dim },
  scroll: { flex: 1 },
  content: { padding: Spacing[6], gap: Spacing[6] },
  intro: {
    fontSize: Typography.fontSize.base,
    color: Colors.brown,
    lineHeight: Typography.fontSize.base * 1.6,
  },
  section: { gap: Spacing[2] },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
  },
  sectionBody: {
    fontSize: Typography.fontSize.sm,
    color: Colors.muted,
    lineHeight: Typography.fontSize.sm * 1.7,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing[4],
  },
  footerText: { fontSize: Typography.fontSize.xs, color: Colors.muted, textAlign: 'center' },
});
