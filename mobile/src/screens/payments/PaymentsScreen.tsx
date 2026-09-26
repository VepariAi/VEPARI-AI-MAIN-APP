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
import PaymentDetailScreen from '@/screens/payments/PaymentDetailScreen';
import PaymentLogScreen from '@/screens/payments/PaymentLogScreen';

interface Props {
  businessId: string;
}

interface PaymentRow {
  id: string;
  type: string;
  amountInPaise: number;
  paymentMethod: string;
  customerId: string | null;
  customerName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  description: string | null;
  date: string;
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
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return `Today ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  PAYMENT: { emoji: '💳', color: Colors.brown },
  CREDIT_ISSUED: { emoji: '📤', color: '#E67E22' },
  CREDIT_RECEIVED: { emoji: '📥', color: Colors.success },
};

export default function PaymentsScreen({ businessId }: Props): React.JSX.Element {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showNewPayment, setShowNewPayment] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getApiClient().listPayments(businessId, { limit: 100 });
      setPayments(data);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewPayment(true)}>
          <Text style={styles.addBtnText}>+ Record</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💳</Text>
              <Text style={styles.emptyTitle}>No payments yet</Text>
              <Text style={styles.emptyText}>Record customer receipts and supplier payments here.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowNewPayment(true)}>
                <Text style={styles.emptyBtnText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const tm = TYPE_META[item.type] ?? { emoji: '💰', color: Colors.brown };
            const party = item.customerName ?? item.supplierName ?? null;
            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setSelectedPaymentId(item.id)}
                style={styles.card}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#FFF3D0' }]}>
                  <Text style={styles.iconEmoji}>{tm.emoji}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>
                    {party ?? item.description ?? 'Payment'}
                  </Text>
                  <Text style={styles.cardMeta}>{relDate(item.date)} · {item.paymentMethod}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.cardAmount, { color: tm.color }]}>{fmtRupees(item.amountInPaise)}</Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {selectedPaymentId ? (
        <Modal visible animationType="slide" onRequestClose={() => setSelectedPaymentId(null)}>
          <PaymentDetailScreen
            businessId={businessId}
            paymentId={selectedPaymentId}
            onClose={() => setSelectedPaymentId(null)}
          />
        </Modal>
      ) : null}

      {showNewPayment ? (
        <Modal visible animationType="slide" onRequestClose={() => setShowNewPayment(false)}>
          <PaymentLogScreen
            businessId={businessId}
            onSaved={() => { setShowNewPayment(false); void load(); }}
            onCancel={() => setShowNewPayment(false)}
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
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 18 },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: Typography.fontSize.base, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  cardMeta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardAmount: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  chevron: { fontSize: 18, color: Colors.muted },
});
