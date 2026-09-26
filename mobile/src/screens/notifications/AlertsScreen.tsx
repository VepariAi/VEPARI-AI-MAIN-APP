import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

type Severity = 'info' | 'warning' | 'critical';

interface Alert {
  type: string;
  severity: Severity;
  message: string;
  amountInPaise?: number;
  party?: string;
  detectedAt: string;
}

interface Props {
  businessId: string;
}

const SEVERITY_META: Record<Severity, { emoji: string; bg: string; border: string; text: string }> = {
  info:     { emoji: 'ℹ️',  bg: '#EEF4FF', border: '#BDD1FF', text: '#1E40AF' },
  warning:  { emoji: '⚠️', bg: '#FFFBEA', border: '#FCD34D', text: '#92400E' },
  critical: { emoji: '🚨', bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B' },
};

const TYPE_LABELS: Record<string, string> = {
  loss_day: 'Daily Loss',
  high_expense: 'High Expenses',
  overdue_credit: 'Overdue Credit',
  low_sales: 'Low Sales',
  large_payable: 'Large Payable',
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsScreen({ businessId }: Props): React.JSX.Element {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getApiClient().getAlerts(businessId);
      setAlerts(data);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => void load(true)}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptyText}>No active alerts detected for your business.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = SEVERITY_META[item.severity];
            return (
              <View style={[styles.card, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardEmoji}>{meta.emoji}</Text>
                  <View style={styles.cardMid}>
                    <Text style={[styles.cardType, { color: meta.text }]}>
                      {TYPE_LABELS[item.type] ?? item.type}
                    </Text>
                    <Text style={styles.cardTime}>{relTime(item.detectedAt)}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: meta.border }]}>
                    <Text style={[styles.badgeText, { color: meta.text }]}>{item.severity}</Text>
                  </View>
                </View>
                <Text style={[styles.cardMessage, { color: meta.text }]}>{item.message}</Text>
                {item.party ? (
                  <Text style={styles.cardParty}>Party: {item.party}</Text>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  refreshBtn: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  refreshBtnText: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  list: { padding: Spacing[4], gap: Spacing[3], paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing[16], gap: Spacing[3] },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.muted, textAlign: 'center', paddingHorizontal: Spacing[8] },
  card: {
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing[4],
    gap: Spacing[2], ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  cardEmoji: { fontSize: 20 },
  cardMid: { flex: 1, gap: 2 },
  cardType: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold },
  cardTime: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  badge: {
    paddingHorizontal: Spacing[2], paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, textTransform: 'capitalize' },
  cardMessage: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, lineHeight: 22 },
  cardParty: { fontSize: Typography.fontSize.sm, color: Colors.muted },
});
