import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';

const VERSION = '0.1.0';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How do I record a sale?',
    answer: 'Tap "Record Sale" on the AI Home screen, or use the voice button and say what you sold. Vepari AI will extract the details automatically.',
  },
  {
    question: 'How does the voice input work?',
    answer: 'Tap the microphone button, speak naturally in Hindi or English, then tap again to stop. Vepari AI will transcribe and identify the transaction for you to confirm.',
  },
  {
    question: 'Does the app work without internet?',
    answer: 'Yes. You can record sales, expenses, and credit entries offline. They are stored locally and synced to the cloud automatically when your connection returns.',
  },
  {
    question: 'How are amounts stored?',
    answer: 'All rupee amounts are stored as paise (1 rupee = 100 paise) to avoid rounding errors. The app always displays amounts in rupees for readability.',
  },
  {
    question: 'How do I set up PIN lock?',
    answer: 'Go to More → Security and toggle on PIN Lock. You can also enable fingerprint or Face ID if your device supports it.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. Tokens and sensitive keys are stored in your device\'s secure keystore (not in regular storage). All communication with servers uses HTTPS.',
  },
  {
    question: 'How do I add a new customer?',
    answer: 'Go to the Customers tab and tap "+ Add Customer". Enter their name and phone number. You can also adjust their credit balance from the Customer Credit quick action.',
  },
  {
    question: 'What is the AI Gateway?',
    answer: 'All AI features (transcription, memory extraction) run through Vepari\'s secure AI Gateway — never directly from your device. Your API keys and AI model access are kept server-side.',
  },
];

const CONTACT_EMAIL = 'support@vepari.ai';
const WEBSITE = 'https://vepari.ai';

function FaqRow({ item }: { item: FaqItem }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.faqRow, open && styles.faqRowOpen]}
      onPress={() => setOpen(o => !o)}
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{item.question}</Text>
        <Text style={styles.faqChevron}>{open ? '▲' : '▼'}</Text>
      </View>
      {open && <Text style={styles.faqA}>{item.answer}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpSupportScreen(): React.JSX.Element {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>
          <View style={styles.card}>
            {FAQS.map((item, i) => (
              <View key={i} style={i > 0 ? styles.faqDivider : undefined}>
                <FaqRow item={item} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.contactEmoji}>✉️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactRow, styles.rowBorder]}
              onPress={() => void Linking.openURL(WEBSITE)}
              activeOpacity={0.7}
            >
              <Text style={styles.contactEmoji}>🌐</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>{WEBSITE}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.version}>Vepari AI v{VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
    paddingBottom: Spacing[2],
  },
  backBtn: { padding: Spacing[1] },
  backText: { color: Colors.gold, fontSize: Typography.fontSize.base },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  scroll: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  section: { gap: Spacing[2] },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  faqDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  faqRow: { padding: Spacing[4] },
  faqRowOpen: { backgroundColor: Colors.ivory },
  faqHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },
  faqQ: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  faqChevron: { fontSize: 10, color: Colors.muted, paddingTop: 3 },
  faqA: { fontSize: Typography.fontSize.sm, color: Colors.muted, marginTop: Spacing[2], lineHeight: 20 },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[3] },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  contactEmoji: { fontSize: 20, width: 28 },
  contactLabel: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  contactValue: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginTop: 2 },
  chevron: { color: Colors.muted, fontSize: Typography.fontSize.xl },
  version: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    color: Colors.muted,
    marginTop: Spacing[4],
  },
});
