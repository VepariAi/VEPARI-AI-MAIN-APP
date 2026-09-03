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
import PurchaseLogScreen from '@/screens/purchases/PurchaseLogScreen';
import SupplierPaymentScreen from '@/screens/suppliers/SupplierPaymentScreen';

interface SupplierDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  payableBalance: number;
  notes: string | null;
  isActive: boolean;
}

interface Purchase {
  id: string;
  totalInPaise: number;
  paymentMethod: string;
  notes: string | null;
  date: string;
  itemCount: number;
}

interface Props {
  businessId: string;
  supplierId: string;
  supplierName: string;
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

export default function SupplierDetailScreen({
  businessId,
  supplierId,
  supplierName,
  onClose,
  onRefreshParent,
}: Props): React.JSX.Element {
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const client = getApiClient();
      const [sup, purList] = await Promise.all([
        client.getSupplierById(businessId, supplierId),
        client.listPurchases(businessId, { supplierId, limit: 30 }),
      ]);
      setSupplier(sup);
      setPurchases(purList);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, supplierId]);

  useEffect(() => { void load(); }, [load]);

  const currentPayable = supplier?.payableBalance ?? 0;

  const handlePurchaseSaved = useCallback((_id: string, totalInPaise: number) => {
    setShowPurchase(false);
    void load();
    onRefreshParent();
    // suppress unused
    void totalInPaise;
  }, [load, onRefreshParent]);

  const handlePaymentDone = useCallback(() => {
    setShowPayment(false);
    void load();
    onRefreshParent();
  }, [load, onRefreshParent]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{supplierName}</Text>
          <View style={styles.closeBtn} />
        </View>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      </SafeAreaView>
    );
  }

  const displayName = supplier?.name ?? supplierName;

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
        {/* Supplier card */}
        <View style={styles.supplierCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.supplierMeta}>
            <Text style={styles.supplierName}>{displayName}</Text>
            {supplier?.phone ? <Text style={styles.metaLine}>📞 {supplier.phone}</Text> : null}
            {supplier?.email ? <Text style={styles.metaLine}>✉ {supplier.email}</Text> : null}
            {supplier?.notes ? <Text style={styles.metaNotes}>{supplier.notes}</Text> : null}
          </View>
        </View>

        {/* Payable balance */}
        <View style={[styles.balanceCard, currentPayable > 0 && styles.balanceCardOwed]}>
          <Text style={styles.balanceLabel}>Outstanding Balance</Text>
          <Text style={[styles.balanceAmount, currentPayable > 0 && styles.balanceAmountOwed]}>
            {currentPayable > 0 ? formatRupees(currentPayable) : '₹0'}
          </Text>
          {currentPayable === 0 && (
            <Text style={styles.balanceClear}>All clear — nothing owed</Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.buyBtn} onPress={() => setShowPurchase(true)}>
            <Text style={styles.buyBtnText}>+ New Purchase</Text>
          </TouchableOpacity>
          {currentPayable > 0 && (
            <TouchableOpacity style={styles.payBtn} onPress={() => setShowPayment(true)}>
              <Text style={styles.payBtnText}>Record Payment</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Purchase history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase History</Text>
          {purchases.length === 0 ? (
            <Text style={styles.empty}>No purchases recorded yet.</Text>
          ) : (
            purchases.map(p => (
              <View key={p.id} style={styles.purchaseRow}>
                <View style={styles.purchaseLeft}>
                  <Text style={styles.purchaseDate}>{formatDate(p.date)}</Text>
                  <Text style={styles.purchaseMeta}>
                    {p.itemCount} {p.itemCount === 1 ? 'item' : 'items'} · {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                  </Text>
                  {p.notes ? <Text style={styles.purchaseNotes}>{p.notes}</Text> : null}
                </View>
                <Text style={styles.purchaseAmount}>{formatRupees(p.totalInPaise)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Purchase modal */}
      {showPurchase && (
        <Modal visible animationType="slide" onRequestClose={() => setShowPurchase(false)}>
          <PurchaseLogScreen
            businessId={businessId}
            supplierId={supplierId}
            supplierName={displayName}
            onCancel={() => setShowPurchase(false)}
            onSaved={handlePurchaseSaved}
          />
        </Modal>
      )}

      {/* Payment modal */}
      {showPayment && supplier && (
        <Modal visible animationType="slide" onRequestClose={() => setShowPayment(false)}>
          <SupplierPaymentScreen
            businessId={businessId}
            supplierId={supplierId}
            supplierName={displayName}
            currentPayableInPaise={currentPayable}
            onCancel={() => setShowPayment(false)}
            onDone={handlePaymentDone}
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

  supplierCard: {
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
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.fontSize.xl, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  supplierMeta: { flex: 1, gap: 4 },
  supplierName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
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
  buyBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    padding: Spacing[3],
    alignItems: 'center',
  },
  buyBtnText: { color: Colors.white, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.sm },
  payBtn: {
    flex: 1,
    backgroundColor: Colors.success,
    borderRadius: Radius.md,
    padding: Spacing[3],
    alignItems: 'center',
  },
  payBtnText: { color: Colors.white, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.sm },

  section: { gap: Spacing[3] },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  empty: { textAlign: 'center', color: Colors.muted, fontSize: Typography.fontSize.sm, marginTop: Spacing[2] },

  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  purchaseLeft: { flex: 1, gap: 2 },
  purchaseDate: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  purchaseMeta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  purchaseNotes: { fontSize: Typography.fontSize.xs, color: Colors.dim, fontStyle: 'italic' },
  purchaseAmount: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
});
