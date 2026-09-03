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
  expenseId: string;
  onClose: () => void;
}

interface ExpenseDetail {
  id: string;
  category: string;
  amountInPaise: number;
  description: string | null;
  notes: string | null;
  paymentMethod: string;
  date: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  purchase:    { label: 'Purchase',    emoji: '📦' },
  salary:      { label: 'Salary',      emoji: '👷' },
  rent:        { label: 'Rent',        emoji: '🏠' },
  utilities:   { label: 'Utilities',   emoji: '💡' },
  transport:   { label: 'Transport',   emoji: '🚛' },
  marketing:   { label: 'Marketing',   emoji: '📢' },
  maintenance: { label: 'Maintenance', emoji: '🔧' },
  other:       { label: 'Other',       emoji: '📝' },
};

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

export default function ExpenseDetailScreen({ businessId, expenseId, onClose }: Props): React.JSX.Element {
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getApiClient().getExpenseById(businessId, expenseId);
      setExpense(data);
    } catch {
      setError('Could not load expense details.');
    } finally {
      setLoading(false);
    }
  }, [businessId, expenseId]);

  useEffect(() => { void load(); }, [load]);

  const categoryInfo = expense ? (CATEGORY_LABELS[expense.category] ?? { label: expense.category, emoji: '📋' }) : null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expense Detail</Text>
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
        ) : expense && categoryInfo ? (
          <ScrollView contentContainerStyle={styles.content}>
            {/* Category header */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
              </View>
              <Text style={styles.categoryLabel}>{categoryInfo.label}</Text>
              <Text style={styles.categoryDate}>{fmtDate(expense.date)}</Text>
            </View>

            {/* Amount */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Amount Spent</Text>
              <Text style={styles.amountValue}>{fmtRupees(expense.amountInPaise)}</Text>
              <View style={styles.paymentBadge}>
                <Text style={styles.paymentBadgeText}>{paymentLabel(expense.paymentMethod)}</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{categoryInfo.emoji} {categoryInfo.label}</Text>
              </View>
              <View style={[styles.detailRow, styles.detailBorder]}>
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={styles.detailValue}>{paymentLabel(expense.paymentMethod)}</Text>
              </View>
              <View style={[styles.detailRow, styles.detailBorder]}>
                <Text style={styles.detailLabel}>Reference ID</Text>
                <Text style={[styles.detailValue, styles.refId]}>#{expense.id.slice(-8).toUpperCase()}</Text>
              </View>
              {expense.description ? (
                <View style={[styles.detailRow, styles.detailBorder]}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={[styles.detailValue, styles.descValue]}>{expense.description}</Text>
                </View>
              ) : null}
            </View>

            {/* Notes */}
            {expense.notes ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Notes</Text>
                <Text style={styles.notesText}>{expense.notes}</Text>
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
  categoryCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[5],
    alignItems: 'center', gap: Spacing[2], borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  categoryIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF3D0',
    alignItems: 'center', justifyContent: 'center',
  },
  categoryEmoji: { fontSize: 28 },
  categoryLabel: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  categoryDate: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  amountCard: {
    backgroundColor: '#5C3D1E', borderRadius: Radius.lg, padding: Spacing[5],
    alignItems: 'center', gap: Spacing[2], ...Shadows.sm,
  },
  amountLabel: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  amountValue: { fontSize: 36, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  paymentBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: Radius.sm, marginTop: 4 },
  paymentBadgeText: { color: Colors.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing[3] },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: Spacing[3] },
  detailBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  detailLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted, flex: 1 },
  detailValue: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium, flex: 1, textAlign: 'right' },
  refId: { letterSpacing: 1 },
  descValue: { textAlign: 'right' },
  notesText: { fontSize: Typography.fontSize.sm, color: Colors.brown, lineHeight: 22 },
});
