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
  saleId: string;
  onClose: () => void;
}

interface SaleDetail {
  id: string;
  customerId: string | null;
  customerName: string | null;
  totalInPaise: number;
  taxInPaise: number;
  discountInPaise: number;
  paymentMethod: string;
  status: string;
  notes: string | null;
  date: string;
  createdAt: string;
  itemCount: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPriceInPaise: number;
    totalInPaise: number;
  }>;
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

export default function SaleReceiptScreen({ businessId, saleId, onClose }: Props): React.JSX.Element {
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getApiClient();
      const data = await client.getSaleById(businessId, saleId);
      setSale(data);
    } catch {
      setError('Could not load sale details.');
    } finally {
      setLoading(false);
    }
  }, [businessId, saleId]);

  useEffect(() => { void load(); }, [load]);

  const subtotal = sale ? sale.items.reduce((s, i) => s + i.totalInPaise, 0) : 0;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sale Receipt</Text>
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
        ) : sale ? (
          <ScrollView contentContainerStyle={styles.content}>
            {/* Receipt header block */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptId}>#{sale.id.slice(-8).toUpperCase()}</Text>
              <Text style={styles.receiptDate}>{fmtDate(sale.date)}</Text>
              <View style={[styles.statusBadge, sale.status === 'completed' ? styles.badgeGreen : styles.badgeAmber]}>
                <Text style={styles.statusText}>{sale.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Total */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>{fmtRupees(sale.totalInPaise)}</Text>
              <View style={styles.paymentRow}>
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentBadgeText}>{paymentLabel(sale.paymentMethod)}</Text>
                </View>
                {sale.customerName ? (
                  <Text style={styles.customerChip}>👤 {sale.customerName}</Text>
                ) : null}
              </View>
            </View>

            {/* Line items */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Items</Text>
              {sale.items.length === 0 ? (
                <Text style={styles.emptyItems}>No item details recorded.</Text>
              ) : (
                sale.items.map((item, idx) => (
                  <View key={item.id} style={[styles.lineItem, idx > 0 && styles.lineItemBorder]}>
                    <View style={styles.lineItemLeft}>
                      <Text style={styles.lineItemName}>{item.productName}</Text>
                      <Text style={styles.lineItemQty}>
                        {item.quantity} × {fmtRupees(item.unitPriceInPaise)}
                      </Text>
                    </View>
                    <Text style={styles.lineItemTotal}>{fmtRupees(item.totalInPaise)}</Text>
                  </View>
                ))
              )}

              {/* Summary rows */}
              <View style={styles.summarySection}>
                {sale.items.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>{fmtRupees(subtotal)}</Text>
                  </View>
                )}
                {sale.taxInPaise > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax</Text>
                    <Text style={styles.summaryValue}>{fmtRupees(sale.taxInPaise)}</Text>
                  </View>
                )}
                {sale.discountInPaise > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount</Text>
                    <Text style={[styles.summaryValue, styles.discountValue]}>-{fmtRupees(sale.discountInPaise)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>{fmtRupees(sale.totalInPaise)}</Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            {sale.notes ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Notes</Text>
                <Text style={styles.notesText}>{sale.notes}</Text>
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
  receiptHeader: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    alignItems: 'center', gap: Spacing[2], borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  receiptId: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown, letterSpacing: 1.5 },
  receiptDate: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  statusBadge: { paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: Radius.sm },
  badgeGreen: { backgroundColor: '#EAF3E8' },
  badgeAmber: { backgroundColor: '#FFF5E0' },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.brown, letterSpacing: 0.5 },
  totalCard: {
    backgroundColor: Colors.brown, borderRadius: Radius.lg, padding: Spacing[5],
    alignItems: 'center', gap: Spacing[2], ...Shadows.sm,
  },
  totalLabel: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  totalAmount: { fontSize: 36, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: 4 },
  paymentBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: Radius.sm },
  paymentBadgeText: { color: Colors.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
  customerChip: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.fontSize.xs },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing[3] },
  emptyItems: { fontSize: Typography.fontSize.sm, color: Colors.muted, textAlign: 'center', paddingVertical: Spacing[3] },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: Spacing[3] },
  lineItemBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  lineItemLeft: { flex: 1, gap: 2 },
  lineItemName: { fontSize: Typography.fontSize.base, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  lineItemQty: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  lineItemTotal: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  summarySection: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing[3], paddingTop: Spacing[3], gap: Spacing[2] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  summaryValue: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  discountValue: { color: Colors.success },
  summaryTotal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing[2], marginTop: Spacing[1] },
  summaryTotalLabel: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  summaryTotalValue: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  notesText: { fontSize: Typography.fontSize.sm, color: Colors.brown, lineHeight: 22 },
});
