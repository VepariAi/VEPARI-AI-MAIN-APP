import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface BriefingItem {
  priority: 'critical' | 'important' | 'actionable' | 'informational';
  category: 'sales' | 'expenses' | 'new_customers' | 'payments' | 'supplier_bills' | 'stock_alerts' | 'opportunities';
  title: string;
  description: string;
  evidence: Record<string, unknown>;
}

interface BriefingSummary {
  totalItems: number;
  criticalCount: number;
  importantCount: number;
  actionableCount: number;
  informationalCount: number;
}

interface BriefingData {
  businessId: string;
  since: string;
  generatedAt: string;
  items: BriefingItem[];
  summary: BriefingSummary;
}

const PRIORITY_CONFIG: Record<BriefingItem['priority'], { label: string; color: string; bg: string }> = {
  critical:      { label: 'Critical',     color: '#C0392B', bg: '#FDEDEC' },
  important:     { label: 'Important',    color: '#D68910', bg: '#FEF9E7' },
  actionable:    { label: 'Actionable',   color: '#1A5276', bg: '#EBF5FB' },
  informational: { label: 'Info',         color: Colors.muted, bg: '#F4F4F4' },
};

const CATEGORY_EMOJI: Record<BriefingItem['category'], string> = {
  sales:          '💰',
  expenses:       '📤',
  new_customers:  '👤',
  payments:       '💳',
  supplier_bills: '🏭',
  stock_alerts:   '📦',
  opportunities:  '⭐',
};

function formatSince(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.round((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return 'last few minutes';
  if (diffH === 1) return '1 hour ago';
  if (diffH < 24) return `${diffH} hours ago`;
  return `${Math.round(diffH / 24)} day${diffH >= 48 ? 's' : ''} ago`;
}

const PRIORITY_ORDER: BriefingItem['priority'][] = ['critical', 'important', 'actionable', 'informational'];

export default function BriefingScreen({ businessId }: { businessId: string }): React.JSX.Element {
  const navigation = useNavigation();
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await getApiClient().getBriefing(businessId);
      setBriefing(data);
    } catch {
      setError('Could not load briefing. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load(true);
  }, [load]);

  const groupedItems = briefing
    ? PRIORITY_ORDER.map(priority => ({
        priority,
        items: briefing.items.filter(i => i.priority === priority),
      })).filter(g => g.items.length > 0)
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Daily Brief</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Gathering your updates…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : briefing ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        >
          {/* Header summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Since {formatSince(briefing.since)}</Text>
            <View style={styles.pillRow}>
              {briefing.summary.criticalCount > 0 && (
                <View style={[styles.pill, { backgroundColor: PRIORITY_CONFIG.critical.bg }]}>
                  <Text style={[styles.pillText, { color: PRIORITY_CONFIG.critical.color }]}>
                    {briefing.summary.criticalCount} critical
                  </Text>
                </View>
              )}
              {briefing.summary.importantCount > 0 && (
                <View style={[styles.pill, { backgroundColor: PRIORITY_CONFIG.important.bg }]}>
                  <Text style={[styles.pillText, { color: PRIORITY_CONFIG.important.color }]}>
                    {briefing.summary.importantCount} important
                  </Text>
                </View>
              )}
              {briefing.summary.actionableCount > 0 && (
                <View style={[styles.pill, { backgroundColor: PRIORITY_CONFIG.actionable.bg }]}>
                  <Text style={[styles.pillText, { color: PRIORITY_CONFIG.actionable.color }]}>
                    {briefing.summary.actionableCount} actionable
                  </Text>
                </View>
              )}
              {briefing.summary.informationalCount > 0 && (
                <View style={[styles.pill, { backgroundColor: PRIORITY_CONFIG.informational.bg }]}>
                  <Text style={[styles.pillText, { color: PRIORITY_CONFIG.informational.color }]}>
                    {briefing.summary.informationalCount} info
                  </Text>
                </View>
              )}
            </View>
          </View>

          {briefing.summary.totalItems === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No significant events in the last 24 hours.</Text>
            </View>
          ) : (
            groupedItems.map(group => (
              <View key={group.priority} style={styles.group}>
                <Text style={[styles.groupLabel, { color: PRIORITY_CONFIG[group.priority].color }]}>
                  {PRIORITY_CONFIG[group.priority].label}
                </Text>
                {group.items.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.itemCard,
                      { borderLeftColor: PRIORITY_CONFIG[item.priority].color },
                    ]}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemEmoji}>{CATEGORY_EMOJI[item.category]}</Text>
                      <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                    </View>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      ) : null}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[6] },
  loadingText: { marginTop: Spacing[3], color: Colors.muted, fontSize: Typography.fontSize.sm },
  errorText: { color: Colors.error, fontSize: Typography.fontSize.base, textAlign: 'center', marginBottom: Spacing[4] },
  retryBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
  },
  retryText: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  scroll: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  summaryTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  pill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
  },
  pillText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  emptyState: { alignItems: 'center', paddingTop: Spacing[10] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[4] },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown, marginBottom: Spacing[2] },
  emptySubtitle: { fontSize: Typography.fontSize.sm, color: Colors.muted, textAlign: 'center' },
  group: { gap: Spacing[2] },
  groupLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: Spacing[1],
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },
  itemEmoji: { fontSize: 20, lineHeight: 24 },
  itemTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
    lineHeight: 22,
  },
  itemDesc: { fontSize: Typography.fontSize.sm, color: Colors.muted, lineHeight: 20 },
});
