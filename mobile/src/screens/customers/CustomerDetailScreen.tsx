import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';
import CustomerCreditScreen from '@/screens/customers/CustomerCreditScreen';

interface CustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  creditBalance: number;
  notes: string | null;
  isActive: boolean;
}

interface Sale {
  id: string;
  totalInPaise: number;
  date: string;
  itemCount: number;
  paymentMethod: string;
  notes: string | null;
}

interface Props {
  businessId: string;
  customerId: string;
  customerName: string;
  onClose: () => void;
  onRefreshParent: () => void;
}

function formatRupees(paise: number): string {
  const r = Math.abs(paise) / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash', UPI: 'UPI', CARD: 'Card', BANK_TRANSFER: 'Bank', CREDIT: 'Credit',
};

export default function CustomerDetailScreen({
  businessId,
  customerId,
  customerName,
  onClose,
  onRefreshParent,
}: Props): React.JSX.Element {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCredit, setShowCredit] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const client = getApiClient();
      const [cust, saleList] = await Promise.all([
        client.getCustomerById(businessId, customerId),
        client.listSales(businessId, { customerId, limit: 30 }),
      ]);
      setCustomer(cust);
      setSales(saleList);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, customerId]);

  useEffect(() => { void load(); }, [load]);

  const handleCreditDone = useCallback(() => {
    setShowCredit(false);
    void load();
    onRefreshParent();
  }, [load, onRefreshParent]);

  const displayName = customer?.name ?? customerName;
  const creditBalance = customer?.creditBalance ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{customerName}</Text>
          <View style={styles.closeBtn} />
        </View>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />
        }
      >
        {/* Customer card */}
        <View style={styles.customerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.customerMeta}>
            <Text style={styles.customerName}>{displayName}</Text>
            {customer?.phone ? <Text style={styles.metaLine}>📞 {customer.phone}</Text> : null}
            {customer?.email ? <Text style={styles.metaLine}>✉ {customer.email}</Text> : null}
            {customer?.notes ? <Text style={styles.metaNotes}>{customer.notes}</Text> : null}
          </View>
        </View>

        {/* Credit balance */}
        <View style={[styles.balanceCard, creditBalance > 0 && styles.balanceCardOwed]}>
          <Text style={styles.balanceLabel}>
            {creditBalance > 0 ? 'Outstanding Credit' : 'Credit Balance'}
          </Text>
          <Text style={[styles.balanceAmount, creditBalance > 0 && styles.balanceAmountOwed]}>
            {creditBalance !== 0 ? formatRupees(creditBalance) : '₹0'}
          </Text>
          {creditBalance === 0 && (
            <Text style={styles.balanceClear}>All settled — no outstanding credit</Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.creditBtn} onPress={() => setShowCredit(true)}>
            <Text style={styles.creditBtnText}>Adjust Credit</Text>
          </TouchableOpacity>
        </View>

        {/* Sale history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sale History</Text>
          {sales.length === 0 ? (
            <Text style={styles.empty}>No sales recorded for this customer yet.</Text>
          ) : (
            sales.map(s => (
              <View key={s.id} style={styles.saleRow}>
                <View style={styles.saleLeft}>
                  <Text style={styles.saleDate}>{formatDate(s.date)}</Text>
                  <Text style={styles.saleMeta}>
                    {s.itemCount} {s.itemCount === 1 ? 'item' : 'items'} · {METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}
                  </Text>
                  {s.notes ? <Text style={styles.saleNotes}>{s.notes}</Text> : null}
                </View>
                <Text style={styles.saleAmount}>{formatRupees(s.totalInPaise)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Credit adjustment modal */}
      {showCredit && (
        <Modal visible animationType="slide" onRequestClose={() => setShowCredit(false)}>
          <CustomerCreditScreen
            businessId={businessId}
            onCancel={() => setShowCredit(false)}
            onDone={handleCreditDone}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 18, color: Colors.muted },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  body: { padding: Spacing[4], gap: Spacing[4], paddingBottom: 40 },

  customerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.fontSize.xl, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  customerMeta: { flex: 1, gap: 4 },
  customerName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  metaLine: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  metaNotes: { fontSize: Typography.fontSize.xs, color: Colors.dim, fontStyle: 'italic', marginTop: 2 },

  balanceCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing[1],
    ...Shadows.sm,
  },
  balanceCardOwed: { borderColor: Colors.error, backgroundColor: '#FFF5F5' },
  balanceLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  balanceAmount: { fontSize: 32, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  balanceAmountOwed: { color: Colors.error },
  balanceClear: { fontSize: Typography.fontSize.xs, color: Colors.success },

  actionRow: { flexDirection: 'row', gap: Spacing[3] },
  creditBtn: {
    flex: 1,
    backgroundColor: Colors.brown,
    borderRadius: Radius.md,
    padding: Spacing[3],
    alignItems: 'center',
  },
  creditBtnText: { color: Colors.ivory, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.sm },

  section: { gap: Spacing[3] },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  empty: { textAlign: 'center', color: Colors.muted, fontSize: Typography.fontSize.sm, marginTop: Spacing[2] },

  saleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saleLeft: { flex: 1, gap: 2 },
  saleDate: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  saleMeta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  saleNotes: { fontSize: Typography.fontSize.xs, color: Colors.dim, fontStyle: 'italic' },
  saleAmount: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
});
