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
import ExpenseDetailScreen from '@/screens/expenses/ExpenseDetailScreen';
import ExpenseLogScreen from '@/screens/expenses/ExpenseLogScreen';

interface Props {
  businessId: string;
}

interface ExpenseRow {
  id: string;
  category: string;
  amountInPaise: number;
  description: string | null;
  notes: string | null;
  paymentMethod: string;
  date: string;
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

export default function ExpensesScreen({ businessId }: Props): React.JSX.Element {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getApiClient().listExpenses(businessId, 100, 0);
      setExpenses(data);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddExpense(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyText}>Track your business expenses here.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddExpense(true)}>
                <Text style={styles.emptyBtnText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const catInfo = CATEGORY_LABELS[item.category] ?? { label: item.category, emoji: '📋' };
            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setSelectedExpenseId(item.id)}
                style={styles.card}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>{catInfo.emoji}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{catInfo.label}</Text>
                  <Text style={styles.cardMeta}>
                    {relDate(item.date)} · {paymentLabel(item.paymentMethod)}
                    {item.description ? ` · ${item.description.slice(0, 25)}` : ''}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardAmount}>-{fmtRupees(item.amountInPaise)}</Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {selectedExpenseId ? (
        <ExpenseDetailScreen
          businessId={businessId}
          expenseId={selectedExpenseId}
          onClose={() => setSelectedExpenseId(null)}
        />
      ) : null}

      {showAddExpense ? (
        <Modal visible animationType="slide" onRequestClose={() => setShowAddExpense(false)}>
          <ExpenseLogScreen
            businessId={businessId}
            onSaved={() => { setShowAddExpense(false); void load(); }}
            onCancel={() => setShowAddExpense(false)}
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
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FDECEA', alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 18 },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: Typography.fontSize.base, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  cardMeta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardAmount: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.error },
  chevron: { fontSize: 18, color: Colors.muted },
});
