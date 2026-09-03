import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
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
  transcribeAudioFile,
} from '@/voice';
import { getApiClient } from '@/services/api';
import SaleLogScreen from '@/screens/sales/SaleLogScreen';
import ExpenseLogScreen from '@/screens/expenses/ExpenseLogScreen';
import MemoryConfirmScreen, { type MemoryCandidate } from '@/memory/MemoryConfirmScreen';

type Props = MainTabScreenProps<'AIHome'>;
type ActiveModal = 'sale' | 'expense' | null;

interface Snapshot {
  businessName: string;
  today: { salesInPaise: number; expensesInPaise: number; profitInPaise: number; grossMarginBps: number };
  receivableInPaise: number;
  payableInPaise: number;
  alertCount: number;
}

function formatRupees(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
}

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AIHomeScreen(_props: Props): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [memoryCandidates, setMemoryCandidates] = useState<MemoryCandidate[]>([]);
  const [showMemoryConfirm, setShowMemoryConfirm] = useState(false);

  const loadSnapshot = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const businesses = await getApiClient().getMyBusinesses();
      if (businesses.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const biz = businesses[0]!;
      setBusinessId(biz.id);
      const snap = await getApiClient().getBusinessSnapshot(biz.id);
      setSnapshot({
        businessName: biz.name,
        today: snap.today,
        receivableInPaise: snap.receivableInPaise,
        payableInPaise: snap.payableInPaise,
        alertCount: snap.alertCount,
      });
    } catch {
      // Show hardcoded fallback silently on network error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadSnapshot(); }, [loadSnapshot]);

  const handleVoicePress = useCallback(async () => {
    setVoiceError('');

    if (getRecorderState() === 'recording') {
      const audioPath = await stopRecording();
      resetRecorder();
      setVoiceActive(false);
      if (audioPath) {
        try {
          const result = await transcribeAudioFile(audioPath);
          setTranscript(result.transcript);
          if (result.transcript.trim().length > 0) {
            try {
              const candidates = await getApiClient().extractMemoryCandidates(result.transcript);
              if (candidates.length > 0) {
                setMemoryCandidates(candidates);
                setShowMemoryConfirm(true);
              }
            } catch {
              // Extraction failure is non-blocking — transcript is still shown
            }
          }
        } catch {
          setVoiceError('Transcription failed. Please try again.');
        }
      }
      return;
    }

    let permission = await checkMicPermission();
    if (permission === 'denied') permission = await requestMicPermission();
    if (permission === 'blocked') {
      Alert.alert('Microphone Required', 'Please enable microphone access in Settings to use voice input.');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} size="large" />
      </SafeAreaView>
    );
  }

  const todaySalesInPaise = snapshot?.today.salesInPaise ?? 0;
  const todayExpensesInPaise = snapshot?.today.expensesInPaise ?? 0;
  const todayProfitInPaise = snapshot?.today.profitInPaise ?? 0;
  const receivableInPaise = snapshot?.receivableInPaise ?? 0;
  const bName = snapshot?.businessName ?? 'Your Business';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void loadSnapshot(true)} tintColor={Colors.gold} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greetingByHour()}</Text>
            <Text style={styles.businessName}>{bName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{bName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Daily briefing */}
        <View style={styles.briefingCard}>
          <Text style={styles.briefingTitle}>Today's Summary</Text>
          <View style={styles.metricsRow}>
            <MetricTile label="Sales" value={formatRupees(todaySalesInPaise)} positive />
            <MetricTile label="Expenses" value={formatRupees(todayExpensesInPaise)} />
            <MetricTile
              label="Profit"
              value={formatRupees(todayProfitInPaise)}
              positive={todayProfitInPaise >= 0}
            />
          </View>
          <View style={styles.receivableRow}>
            <Text style={styles.receivableLabel}>Receivable</Text>
            <Text style={styles.receivableValue}>{formatRupees(receivableInPaise)}</Text>
          </View>
        </View>

        {/* Alerts */}
        {(snapshot?.alertCount ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            <View style={styles.alertCard}>
              <Text style={styles.alertDot}>⚠️</Text>
              <Text style={styles.alertText}>
                {snapshot!.alertCount} alert{snapshot!.alertCount > 1 ? 's' : ''} need your attention
              </Text>
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction emoji="💰" label="Record Sale" onPress={() => setActiveModal('sale')} />
            <QuickAction emoji="💸" label="Add Expense" onPress={() => setActiveModal('expense')} />
            <QuickAction emoji="👤" label="Customer Credit" onPress={() => undefined} />
            <QuickAction emoji="📦" label="Check Stock" onPress={() => undefined} />
          </View>
        </View>

        {voiceError ? <Text style={styles.voiceError}>{voiceError}</Text> : null}
        {transcript ? (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>You said:</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        ) : null}
        {businessId == null && !loading && (
          <Text style={styles.noBusinessText}>No business set up yet. Complete onboarding first.</Text>
        )}
      </ScrollView>

      {/* Sale modal */}
      <Modal
        visible={activeModal === 'sale'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setActiveModal(null)}
      >
        {businessId != null ? (
          <SaleLogScreen
            businessId={businessId}
            onSaved={(_id, amount) => {
              setActiveModal(null);
              void loadSnapshot(true);
              Alert.alert('Sale recorded', `₹${(amount / 100).toFixed(0)} saved`);
            }}
            onCancel={() => setActiveModal(null)}
          />
        ) : null}
      </Modal>

      {/* Expense modal */}
      <Modal
        visible={activeModal === 'expense'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setActiveModal(null)}
      >
        {businessId != null ? (
          <ExpenseLogScreen
            businessId={businessId}
            onSaved={(_id, amount) => {
              setActiveModal(null);
              void loadSnapshot(true);
              Alert.alert('Expense logged', `₹${(amount / 100).toFixed(0)} saved`);
            }}
            onCancel={() => setActiveModal(null)}
          />
        ) : null}
      </Modal>

      {/* Memory confirm modal */}
      <Modal
        visible={showMemoryConfirm}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMemoryConfirm(false)}
      >
        {businessId != null ? (
          <MemoryConfirmScreen
            businessId={businessId}
            candidates={memoryCandidates}
            onDone={() => {
              setShowMemoryConfirm(false);
              setMemoryCandidates([]);
              setTranscript('');
            }}
            onCancel={() => {
              setShowMemoryConfirm(false);
              setMemoryCandidates([]);
            }}
          />
        ) : null}
      </Modal>

      {/* AI Voice Button */}
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

function QuickAction({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <TouchableOpacity style={styles.quickAction} activeOpacity={0.8} onPress={onPress}>
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
  voiceError: { color: Colors.error, fontSize: Typography.fontSize.sm, textAlign: 'center', marginTop: Spacing[2] },
  transcriptCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing[4],
    marginTop: Spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  transcriptLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginBottom: 4 },
  transcriptText: { fontSize: Typography.fontSize.base, color: Colors.brown },
  noBusinessText: { textAlign: 'center', color: Colors.muted, fontSize: Typography.fontSize.sm, marginTop: Spacing[4] },
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
