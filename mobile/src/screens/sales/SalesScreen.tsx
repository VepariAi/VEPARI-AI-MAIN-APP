import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';
import SaleReceiptScreen from '@/screens/sales/SaleReceiptScreen';
import SaleLogScreen from '@/screens/sales/SaleLogScreen';

interface Props {
  businessId: string;
}

interface SaleRow {
  id: string;
  totalInPaise: number;
  date: string;
  itemCount: number;
  paymentMethod: string;
  notes: string | null;
}

function fmtRupees(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

function relDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return `Today ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function paymentLabel(method: string): string {
  switch (method) {
    case 'CASH': return 'Cash';
    case 'UPI': return 'UPI';
    case 'CARD': return 'Card';
    case 'CREDIT': return 'Credit';
    case 'BANK_TRANSFER': return 'Bank';
    default: return method;
  }
}

export default function SalesScreen({ businessId }: Props): React.JSX.Element {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showNewSale, setShowNewSale] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getApiClient().listSales(businessId, { limit: 100 });
      setSales(data);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewSale(true)}>
          <Text style={styles.addBtnText}>+ New Sale</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💰</Text>
              <Text style={styles.emptyTitle}>No sales yet</Text>
              <Text style={styles.emptyText}>Record your first sale to see it here.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowNewSale(true)}>
                <Text style={styles.emptyBtnText}>Record Sale</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setSelectedSaleId(item.id)}
              style={styles.card}
            >
              <View style={styles.cardLeft}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>💰</Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                  {item.itemCount} item{item.itemCount !== 1 ? 's' : ''}
                  {item.notes ? ` · ${item.notes.slice(0, 30)}` : ''}
                </Text>
                <Text style={styles.cardMeta}>{relDate(item.date)} · {paymentLabel(item.paymentMethod)}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>+{fmtRupees(item.totalInPaise)}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {selectedSaleId ? (
        <SaleReceiptScreen
          businessId={businessId}
          saleId={selectedSaleId}
          onClose={() => {
            setSelectedSaleId(null);
          }}
        />
      ) : null}

      {showNewSale ? (
        <Modal visible animationType="slide" onRequestClose={() => setShowNewSale(false)}>
          <SaleLogScreen
            businessId={businessId}
            onSaved={(_saleId) => { setShowNewSale(false); void load(); }}
            onCancel={() => setShowNewSale(false)}
          />
        </Modal>
      ) : null}
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
  addBtn: { backgroundColor: Colors.brown, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: Radius.md },
  addBtnText: { color: Colors.white, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  listContent: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[8] },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing[16], gap: Spacing[3] },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.muted, textAlign: 'center' },
  emptyBtn: { backgroundColor: Colors.brown, paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderRadius: Radius.md, marginTop: Spacing[2] },
  emptyBtnText: { color: Colors.white, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  cardLeft: {},
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAF3E8', alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 18 },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: Typography.fontSize.base, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  cardMeta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardAmount: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.success },
  chevron: { fontSize: 18, color: Colors.muted },
});
