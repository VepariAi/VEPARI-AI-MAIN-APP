import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

type ReturnItem = {
  id: string;
  type: string;
  status: string;
  referenceId: string;
  totalRefundInPaise: number;
  createdAt: string;
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: Colors.gold,
  APPROVED: '#3B82F6',
  REFUNDED: '#22C55E',
  REJECTED: '#EF4444',
};

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REFUNDED', 'REJECTED'];

function fmt(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

interface Props {
  businessId: string;
}

export default function ReturnsScreen({ businessId }: Props): React.JSX.Element {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const status = filter === 'ALL' ? undefined : filter;
      const data = await getApiClient().listReturns(businessId, status);
      setReturns(data);
      setError(null);
    } catch {
      setError('Could not load returns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, filter]);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: ReturnItem }) => (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${item.type} return ${item.status} ${fmt(item.totalRefundInPaise)}`}
    >
      <View style={styles.row}>
        <Text style={styles.icon}>{item.type === 'SALE_RETURN' ? '↩️' : '↪️'}</Text>
        <View style={{ flex: 1, marginLeft: Spacing[2] }}>
          <Text style={styles.refId} numberOfLines={1}>Ref: {item.referenceId}</Text>
          <Text style={styles.type}>{item.type === 'SALE_RETURN' ? 'Customer Return' : 'Supplier Return'}</Text>
        </View>
        <View>
          <Text style={styles.amount}>{fmt(item.totalRefundInPaise)}</Text>
          <View style={[styles.pill, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
            <Text style={[styles.pillText, { color: STATUS_COLOR[item.status] }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.date}>{fmtDate(item.createdAt)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, filter === s && styles.filterTabActive]}
            onPress={() => setFilter(s)}
            accessibilityLabel={`Filter returns by ${s}`}
            accessibilityRole="button"
          >
            <Text style={[styles.filterLabel, filter === s && styles.filterLabelActive]}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
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
      ) : returns.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>↩️</Text>
          <Text style={styles.emptyText}>No returns yet</Text>
          <Text style={styles.emptyHint}>Customer and supplier returns will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={returns}
          keyExtractor={r => r.id}
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
  filterLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted, fontWeight: Typography.fontWeight.medium },
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
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 22 },
  refId: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
  },
  type: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginTop: 2 },
  amount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
    textAlign: 'right',
  },
  pill: { paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: Radius.sm, marginTop: 4, alignSelf: 'flex-end' },
  pillText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
  date: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginTop: Spacing[2] },
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
