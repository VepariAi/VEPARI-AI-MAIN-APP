import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

type Op = {
  id: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedValueInPaise: number | null;
  createdAt: string;
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: Colors.gold,
  IN_PROGRESS: '#3B82F6',
  COMPLETED: '#22C55E',
  CANCELLED: Colors.muted,
};

const PRIORITY_DOT: Record<string, string> = {
  URGENT: '#EF4444',
  HIGH: '#F97316',
  NORMAL: Colors.gold,
  LOW: Colors.muted,
};

const TYPE_EMOJI: Record<string, string> = {
  ORDER: '📦',
  TASK: '✅',
  SERVICE_REQUEST: '🛠',
  REPAIR: '🔧',
  DELIVERY: '🚚',
};

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function fmt(paise: number | null): string {
  if (paise == null) return '';
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

interface Props {
  businessId: string;
}

export default function OperationsScreen({ businessId }: Props): React.JSX.Element {
  const [ops, setOps] = useState<Op[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const status = filter === 'ALL' ? undefined : filter;
      const data = await getApiClient().listOperations(businessId, status);
      setOps(data);
      setError(null);
    } catch {
      setError('Could not load operations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, filter]);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: Op }) => (
    <View style={styles.card} accessible accessibilityLabel={`${item.type} ${item.title} ${item.status}`}>
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{TYPE_EMOJI[item.type] ?? '📋'}</Text>
        <View style={{ flex: 1, marginLeft: Spacing[2] }}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.type}>{item.type.replace('_', ' ')}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_DOT[item.priority] }]} />
        <Text style={styles.meta}>{item.priority}</Text>
        {item.dueDate ? (
          <Text style={styles.meta}>  Due {fmtDate(item.dueDate)}</Text>
        ) : null}
        {item.estimatedValueInPaise ? (
          <Text style={[styles.meta, styles.amount]}>{fmt(item.estimatedValueInPaise)}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, filter === s && styles.filterTabActive]}
            onPress={() => setFilter(s)}
            accessibilityLabel={`Filter by ${s}`}
            accessibilityRole="button"
          >
            <Text style={[styles.filterLabel, filter === s && styles.filterLabelActive]}>
              {s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.gold} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : ops.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>No operations yet</Text>
          <Text style={styles.emptyHint}>Work orders and tasks will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={ops}
          keyExtractor={o => o.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.gold} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.ivory },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    gap: Spacing[1],
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.xl,
    backgroundColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.brown },
  filterLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.muted,
    fontWeight: Typography.fontWeight.medium,
  },
  filterLabelActive: { color: Colors.ivory },
  list: { padding: Spacing[4], gap: Spacing[3] },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing[4],
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 24 },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
  },
  type: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginTop: 2 },
  statusPill: { paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: Radius.sm },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing[3], gap: Spacing[2] },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  meta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  amount: { marginLeft: 'auto', color: Colors.brown, fontWeight: Typography.fontWeight.semibold },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[6] },
  errorText: { color: Colors.muted, marginBottom: Spacing[2] },
  retry: { color: Colors.gold, fontWeight: Typography.fontWeight.semibold },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[3] },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
    marginBottom: Spacing[1],
  },
  emptyHint: { fontSize: Typography.fontSize.sm, color: Colors.muted, textAlign: 'center' },
});
