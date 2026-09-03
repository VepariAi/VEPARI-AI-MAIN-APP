import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface Props {
  businessId: string;
  purchaseId: string;
  onClose: () => void;
}

interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCostInPaise: number;
  totalInPaise: number;
}

interface PurchaseDetail {
  id: string;
  businessId: string;
  supplierId: string | null;
  supplierName: string | null;
  totalInPaise: number;
  paymentMethod: string;
  status: string;
  notes: string | null;
  date: string;
  createdAt: string;
  itemCount: number;
  items: PurchaseItem[];
}

function fmtRupees(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(2)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(2)}K`;
  return `₹${r.toFixed(2)}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + '  '
    + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function paymentLabel(method: string): string {
  switch (method) {
    case 'CASH': return 'Cash';
    case 'UPI': return 'UPI';
    case 'CARD': return 'Card';
    case 'CREDIT': return 'Credit';
    case 'BANK_TRANSFER': return 'Bank Transfer';
    case 'CHEQUE': return 'Cheque';
    default: return method;
  }
}

export default function PurchaseDetailScreen({ businessId, purchaseId, onClose }: Props): React.JSX.Element {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getApiClient().getPurchaseById(businessId, purchaseId);
      setPurchase(data);
    } catch {
      setError('Could not load purchase details.');
    } finally {
      setLoading(false);
    }
  }, [businessId, purchaseId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Purchase Detail</Text>
          <View style={styles.closeBtn} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : purchase ? (
          <ScrollView contentContainerStyle={styles.content}>
            {/* Hero card */}
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Text style={styles.heroEmoji}>🛒</Text>
              </View>
              <Text style={styles.heroTitle}>Stock Purchase</Text>
              {purchase.supplierName ? (
                <Text style={styles.heroSub}>from {purchase.supplierName}</Text>
              ) : null}
              <Text style={styles.heroDate}>{fmtDate(purchase.date)}</Text>
            </View>

            {/* Total */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Cost</Text>
              <Text style={styles.totalValue}>{fmtRupees(purchase.totalInPaise)}</Text>
              <View style={styles.paymentBadge}>
                <Text style={styles.paymentBadgeText}>{paymentLabel(purchase.paymentMethod)}</Text>
              </View>
            </View>

            {/* Line items */}
            {purchase.items.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Items Purchased</Text>
                {purchase.items.map((item, idx) => (
                  <View key={item.id} style={[styles.itemRow, idx > 0 && styles.itemBorder]}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemMeta}>
                        {item.quantity} × {fmtRupees(item.unitCostInPaise)}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>{fmtRupees(item.totalInPaise)}</Text>
                  </View>
                ))}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>{fmtRupees(purchase.totalInPaise)}</Text>
                </View>
              </View>
            ) : null}

            {/* Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference ID</Text>
                <Text style={[styles.detailValue, styles.refId]}>#{purchase.id.slice(-8).toUpperCase()}</Text>
              </View>
              <View style={[styles.detailRow, styles.detailBorder]}>
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={styles.detailValue}>{paymentLabel(purchase.paymentMethod)}</Text>
              </View>
              {purchase.supplierName ? (
                <View style={[styles.detailRow, styles.detailBorder]}>
                  <Text style={styles.detailLabel}>Supplier</Text>
                  <Text style={styles.detailValue}>{purchase.supplierName}</Text>
                </View>
              ) : null}
              <View style={[styles.detailRow, styles.detailBorder]}>
                <Text style={styles.detailLabel}>Items</Text>
                <Text style={styles.detailValue}>{purchase.itemCount} product{purchase.itemCount !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Notes */}
            {purchase.notes ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Notes</Text>
                <Text style={styles.notesText}>{purchase.notes}</Text>
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 16, color: Colors.muted },
  content: { padding: Spacing[4], gap: Spacing[3] },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  errorText: { color: Colors.error, fontSize: Typography.fontSize.sm },
  retryBtn: { backgroundColor: Colors.brown, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: Radius.md },
  retryText: { color: Colors.white, fontSize: Typography.fontSize.sm },
  heroCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[5],
    alignItems: 'center', gap: Spacing[2], borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF3D0',
    alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 28 },
  heroTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  heroSub: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  heroDate: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  totalCard: {
    backgroundColor: '#5C3D1E', borderRadius: Radius.lg, padding: Spacing[5],
    alignItems: 'center', gap: Spacing[2], ...Shadows.sm,
  },
  totalLabel: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  totalValue: { fontSize: 36, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  paymentBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: Radius.sm, marginTop: 4 },
  paymentBadgeText: { color: Colors.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing[3] },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: Spacing[3] },
  itemBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  itemMeta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  itemTotal: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.semibold },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing[3], marginTop: Spacing[1],
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  summaryLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted, fontWeight: Typography.fontWeight.medium },
  summaryValue: { fontSize: Typography.fontSize.base, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: Spacing[3] },
  detailBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  detailLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted, flex: 1 },
  detailValue: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium, flex: 1, textAlign: 'right' },
  refId: { letterSpacing: 1 },
  notesText: { fontSize: Typography.fontSize.sm, color: Colors.brown, lineHeight: 22 },
});
