import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import type { MainTabScreenProps } from '@/navigation/types';
import {
  startRecording,
  stopRecording,
  getRecorderState,
  resetRecorder,
  checkMicPermission,
  requestMicPermission,
} from '@/voice';

type Props = MainTabScreenProps<'AIHome'>;

// Placeholder daily briefing data — replaced with real API data in a later phase
const BRIEFING = {
  greeting: 'Good morning',
  businessName: 'Sharma General Store',
  todaySalesInPaise: 485000,
  todayExpensesInPaise: 120000,
  todayProfitInPaise: 365000,
  receivableInPaise: 1250000,
  alerts: [
    { id: '1', type: 'low_stock', message: '3 products running low on stock' },
    { id: '2', type: 'credit', message: 'Rajan owes ₹2,500 — due 3 days ago' },
  ],
};

function formatRupees(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
}

export default function AIHomeScreen(_props: Props): React.JSX.Element {
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const handleVoicePress = useCallback(async () => {
    setVoiceError('');

    if (getRecorderState() === 'recording') {
      // Stop and hand off audio file path to STT (PROMPT 102)
      await stopRecording();
      resetRecorder();
      setVoiceActive(false);
      return;
    }

    // Check / request permission before starting
    let permission = await checkMicPermission();
    if (permission === 'denied') {
      permission = await requestMicPermission();
    }
    if (permission === 'blocked') {
      Alert.alert(
        'Microphone Required',
        'Please enable microphone access in Settings to use voice input.',
        [{ text: 'OK' }],
      );
      return;
    }
    if (permission !== 'granted') {
      setVoiceError('Microphone permission not granted.');
      return;
    }

    try {
      await startRecording();
      setVoiceActive(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording.';
      setVoiceError(message);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{BRIEFING.greeting}</Text>
            <Text style={styles.businessName}>{BRIEFING.businessName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        </View>

        {/* Daily briefing */}
        <View style={styles.briefingCard}>
          <Text style={styles.briefingTitle}>Today's Summary</Text>
          <View style={styles.metricsRow}>
            <MetricTile label="Sales" value={formatRupees(BRIEFING.todaySalesInPaise)} positive />
            <MetricTile label="Expenses" value={formatRupees(BRIEFING.todayExpensesInPaise)} />
            <MetricTile label="Profit" value={formatRupees(BRIEFING.todayProfitInPaise)} positive />
          </View>
          <View style={styles.receivableRow}>
            <Text style={styles.receivableLabel}>Total Receivable</Text>
            <Text style={styles.receivableValue}>
              {formatRupees(BRIEFING.receivableInPaise)}
            </Text>
          </View>
        </View>

        {/* Alerts */}
        {BRIEFING.alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {BRIEFING.alerts.map(alert => (
              <View key={alert.id} style={styles.alertCard}>
                <Text style={styles.alertDot}>⚠️</Text>
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction emoji="💰" label="Record Sale" />
            <QuickAction emoji="💸" label="Add Expense" />
            <QuickAction emoji="👤" label="Customer Credit" />
            <QuickAction emoji="📦" label="Check Stock" />
          </View>
        </View>

        {voiceError ? <Text style={styles.voiceError}>{voiceError}</Text> : null}
      </ScrollView>

      {/* AI Voice Button — hold to record */}
      <View style={styles.voiceFab}>
        <TouchableOpacity
          style={[styles.voiceBtn, voiceActive && styles.voiceBtnActive]}
          onPress={() => void handleVoicePress()}
          activeOpacity={0.85}
        >
          <Text style={styles.voiceBtnText}>{voiceActive ? '🔴' : '🎙️'}</Text>
          <Text style={styles.voiceBtnLabel}>
            {voiceActive ? 'Tap to stop' : 'Speak to Vepari AI'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MetricTile({ label, value, positive }: { label: string; value: string; positive?: boolean }): React.JSX.Element {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, positive && styles.metricPositive]}>{value}</Text>
    </View>
  );
}

function QuickAction({ emoji, label }: { emoji: string; label: string }): React.JSX.Element {
  return (
    <TouchableOpacity style={styles.quickAction} activeOpacity={0.8}>
      <Text style={styles.quickActionEmoji}>{emoji}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  scroll: { padding: Spacing[4], paddingBottom: 140 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  greeting: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  businessName: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  briefingCard: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    ...Shadows.md,
  },
  briefingTitle: { color: Colors.dim, fontSize: Typography.fontSize.sm, marginBottom: Spacing[3] },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing[3] },
  metricTile: { alignItems: 'center', gap: 4 },
  metricLabel: { color: Colors.dim, fontSize: Typography.fontSize.xs },
  metricValue: { color: Colors.ivory, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  metricPositive: { color: Colors.gold },
  receivableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: Spacing[3],
  },
  receivableLabel: { color: Colors.dim, fontSize: Typography.fontSize.sm },
  receivableValue: { color: Colors.warning, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  section: { marginBottom: Spacing[4] },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown, marginBottom: Spacing[2] },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  alertDot: { fontSize: Typography.fontSize.base },
  alertText: { flex: 1, color: Colors.brown, fontSize: Typography.fontSize.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  quickAction: {
    width: '45%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    alignItems: 'center',
    gap: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionEmoji: { fontSize: 28 },
  quickActionLabel: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium, textAlign: 'center' },
  voiceError: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginTop: Spacing[2],
  },
  voiceFab: { position: 'absolute', bottom: 80, left: 0, right: 0, paddingHorizontal: Spacing[6] },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.brown,
    borderRadius: Radius.full,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    ...Shadows.lg,
  },
  voiceBtnActive: { backgroundColor: Colors.terra },
  voiceBtnText: { fontSize: 24 },
  voiceBtnLabel: { color: Colors.ivory, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium },
});
