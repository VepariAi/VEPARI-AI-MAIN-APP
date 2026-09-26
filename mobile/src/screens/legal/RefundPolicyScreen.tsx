import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '@vepari/design-system';

const SECTIONS = [
  {
    title: '1. Scope',
    body: 'This Refund and Cancellation Policy applies to all paid subscription plans offered by Vepari Technologies for the Vepari AI application. It is governed by Indian consumer protection laws, including the Consumer Protection Act 2019 and applicable RBI guidelines.',
  },
  {
    title: '2. Subscription Plans',
    body: 'Vepari AI is offered on a subscription basis (monthly or annual). Subscriptions renew automatically unless cancelled at least 24 hours before the renewal date.',
  },
  {
    title: '3. Cancellation',
    body: 'You may cancel your subscription at any time:\n• In-app: More → Billing → Cancel Subscription.\n• Email: vepariai@gmail.com with subject "Cancel Subscription".\n\nUpon cancellation, you retain access to paid features until the end of your current billing period. No further charges will be made.',
  },
  {
    title: '4. Refunds — General Rule',
    body: 'All payments are final and non-refundable except in the specific circumstances listed below. This is standard practice for software subscriptions in India.',
  },
  {
    title: '5. Eligible Refunds',
    body: 'You are entitled to a full refund if:\n• You were charged after cancelling your subscription.\n• There was a duplicate or erroneous payment caused by a technical error on our side.\n• The subscription was purchased within the last 7 days and the app fails to function as described despite us being unable to resolve the issue.\n\nTo claim a refund, contact vepariai@gmail.com within 30 days of the charge with your order ID and a description of the issue.',
  },
  {
    title: '6. Refund Processing',
    body: 'Approved refunds are processed within 5–7 business days. The amount is credited to the original payment method. Bank processing time may add 3–5 additional days.',
  },
  {
    title: '7. Free Trials',
    body: 'If a free trial is offered, you will not be charged during the trial period. You may cancel before the trial ends without incurring any charges.',
  },
  {
    title: '8. Ineligible Refunds',
    body: 'Refunds are not provided for:\n• Change of mind after using the service.\n• Forgetting to cancel before renewal.\n• Inability to use the app due to the user\'s own device limitations or internet connectivity.\n• Dissatisfaction with AI-generated insights (we disclaim financial accuracy per our Terms).',
  },
  {
    title: '9. Dispute Resolution',
    body: 'If you disagree with our refund decision, you may escalate to:\n1. Our grievance officer: vepariai@gmail.com (response within 14 days).\n2. Your bank / payment provider for a chargeback under applicable card network rules.\n3. The Consumer Disputes Redressal Commission in your jurisdiction.',
  },
  {
    title: '10. Contact',
    body: 'Refund requests and billing queries:\nvepariai@gmail.com\nSubject: "Refund Request — [Your Phone Number]"\nResponse time: 2 business days.',
  },
];

export default function RefundPolicyScreen(): React.JSX.Element {
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
        <Text style={styles.heading}>Refund & Cancellation Policy</Text>
        <Text style={styles.updated}>Last updated: 1 September 2025</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          This policy explains when and how you can cancel your Vepari AI subscription and request a refund. Please read it before purchasing a subscription.
        </Text>

        {SECTIONS.map(s => (
          <View key={s.title} style={styles.section} accessible accessibilityLabel={s.title}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Vepari Technologies · vepariai@gmail.com{'\n'}
            Jurisdiction: Bengaluru, Karnataka, India
          </Text>
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
