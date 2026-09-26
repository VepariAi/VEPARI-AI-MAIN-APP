import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface Props {
  businessId: string;
  paymentId: string;
  onClose: () => void;
}

interface PaymentDetail {
  id: string;
  type: string;
  amountInPaise: number;
  paymentMethod: string;
  customerId: string | null;
  customerName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  description: string | null;
  notes: string | null;
  date: string;
  createdAt: string;
}

function fmtRupees(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash', UPI: 'UPI', CARD: 'Card', BANK_TRANSFER: 'Bank Transfer', CREDIT: 'Credit',
};

const TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  PAYMENT: { label: 'Payment', emoji: '💳', color: Colors.brown },
  CREDIT_ISSUED: { label: 'Credit Issued', emoji: '📤', color: '#E67E22' },
  CREDIT_RECEIVED: { label: 'Credit Received', emoji: '📥', color: Colors.success },
};

export default function PaymentDetailScreen({ businessId, paymentId, onClose }: Props): React.JSX.Element {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const p = await getApiClient().getPaymentById(businessId, paymentId);
      setPayment(p);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [businessId, paymentId]);

  useEffect(() => { void load(); }, [load]);

  const meta = payment ? (TYPE_META[payment.type] ?? { label: payment.type, emoji: '💰', color: Colors.brown }) : null;
  const party = payment?.customerName ?? payment?.supplierName ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Detail</Text>
        <View style={styles.closeBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      ) : error || !payment ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>Could not load payment.</Text>
          <TouchableOpacity onPress={() => void load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {/* Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconCircle}>
              <Text style={styles.heroEmoji}>{meta?.emoji ?? '💰'}</Text>
            </View>
            <Text style={styles.heroLabel}>{meta?.label ?? payment.type}</Text>
            <Text style={styles.heroAmount}>{fmtRupees(payment.amountInPaise)}</Text>
            {party ? <Text style={styles.heroParty}>{party}</Text> : null}
            <Text style={styles.heroDate}>{fmtDate(payment.date)}</Text>
          </View>

          {/* Details card */}
          <View style={styles.detailCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Method</Text>
              <Text style={styles.rowValue}>{METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}</Text>
            </View>
            {payment.customerName ? (
              <View style={[styles.row, styles.rowBorder]}>
                <Text style={styles.rowLabel}>Customer</Text>
                <Text style={styles.rowValue}>{payment.customerName}</Text>
              </View>
            ) : null}
            {payment.supplierName ? (
              <View style={[styles.row, styles.rowBorder]}>
                <Text style={styles.rowLabel}>Supplier</Text>
                <Text style={styles.rowValue}>{payment.supplierName}</Text>
              </View>
            ) : null}
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Recorded</Text>
              <Text style={styles.rowValue}>{fmtDate(payment.createdAt)}</Text>
            </View>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Ref ID</Text>
              <Text style={[styles.rowValue, styles.refId]}>{payment.id.slice(0, 8).toUpperCase()}</Text>
            </View>
          </View>

          {/* Description / Notes */}
          {payment.description || payment.notes ? (
            <View style={styles.notesCard}>
              {payment.description ? (
                <>
                  <Text style={styles.notesLabel}>Description</Text>
                  <Text style={styles.notesText}>{payment.description}</Text>
                </>
              ) : null}
              {payment.notes ? (
                <>
                  <Text style={[styles.notesLabel, payment.description ? { marginTop: Spacing[3] } : {}]}>Notes</Text>
                  <Text style={styles.notesText}>{payment.notes}</Text>
                </>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
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
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 18, color: Colors.muted },
  headerTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  errorText: { fontSize: Typography.fontSize.base, color: Colors.muted },
  retryBtn: { backgroundColor: Colors.brown, paddingHorizontal: Spacing[5], paddingVertical: Spacing[2], borderRadius: Radius.md },
  retryText: { color: Colors.white, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.sm },
  body: { padding: Spacing[4], gap: Spacing[4], paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[5],
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: Spacing[2], ...Shadows.sm,
  },
  heroIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF3D0', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 26 },
  heroLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted, fontWeight: Typography.fontWeight.medium },
  heroAmount: { fontSize: 32, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  heroParty: { fontSize: Typography.fontSize.base, color: Colors.brown },
  heroDate: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  detailCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  rowValue: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  refId: { fontFamily: 'monospace', fontSize: Typography.fontSize.xs },
  notesCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  notesLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted, fontWeight: Typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing[1] },
  notesText: { fontSize: Typography.fontSize.sm, color: Colors.brown },
});
