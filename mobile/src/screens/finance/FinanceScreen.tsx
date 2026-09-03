import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';
import SaleReceiptScreen from '@/screens/sales/SaleReceiptScreen';
import ExpenseDetailScreen from '@/screens/expenses/ExpenseDetailScreen';

const TABS = ['Overview', 'Transactions'] as const;
type Tab = typeof TABS[number];

type TxnType = 'SALE' | 'EXPENSE' | 'PURCHASE' | 'PAYMENT_IN' | 'PAYMENT_OUT' | 'CREDIT_GIVEN' | 'CREDIT_RECEIVED' | 'ADJUSTMENT';

interface Transaction {
  id: string;
  type: TxnType;
  amountInPaise: number;
  description: string | null;
  date: string;
  paymentMethod: string;
  referenceId: string | null;
}

interface ProfitSummary {
  salesInPaise: number;
  expensesInPaise: number;
  profitInPaise: number;
  grossMarginBps: number;
}

interface CashFlowSummary {
  cashInflowInPaise: number;
  cashOutflowInPaise: number;
  netCashFlowInPaise: number;
}

interface ReceivablesPayables {
  totalReceivablesInPaise: number;
  totalPayablesInPaise: number;
  customersWithBalance: number;
  suppliersWithBalance: number;
}

function fmt(paise: number): string {
  const r = Math.abs(paise) / 100;
  const sign = paise < 0 ? '-' : '';
  if (r >= 100000) return `${sign}₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `${sign}₹${(r / 1000).toFixed(1)}K`;
  return `${sign}₹${r.toFixed(0)}`;
}

function txnEmoji(type: TxnType): string {
  switch (type) {
    case 'SALE': return '💰';
    case 'EXPENSE': return '💸';
    case 'PURCHASE': return '🛒';
    case 'PAYMENT_IN': return '📥';
    case 'PAYMENT_OUT': return '📤';
    case 'CREDIT_GIVEN': return '🤝';
    case 'CREDIT_RECEIVED': return '🏦';
    default: return '📋';
  }
}

function isInflow(type: TxnType): boolean {
  return type === 'SALE' || type === 'PAYMENT_IN' || type === 'CREDIT_RECEIVED';
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return `Today ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  if (diffDays === 1) return 'Yesterday';
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function FinanceScreen(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [monthSummary, setMonthSummary] = useState<ProfitSummary | null>(null);
  const [cashFlowToday, setCashFlowToday] = useState<CashFlowSummary | null>(null);
  const [receivablesPayables, setReceivablesPayables] = useState<ReceivablesPayables | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const client = getApiClient();
      const businesses = await client.getMyBusinesses();
      const biz = businesses[0];
      if (!biz) return;
      setBusinessId(biz.id);
      const [summary, cashFlow, recPay, txns] = await Promise.all([
        client.getProfitMonth(biz.id),
        client.getCashFlowToday(biz.id),
        client.getReceivablesPayables(biz.id),
        client.listTransactions(biz.id, 50, 0),
      ]);
      setMonthSummary(summary);
      setCashFlowToday(cashFlow);
      setReceivablesPayables(recPay);
      setTransactions(txns);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finance</Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Overview' && (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
        >
          {/* Cash flow today */}
          {cashFlowToday ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Today's Cash Flow</Text>
              <View style={styles.twoCol}>
                <View style={[styles.miniCard, styles.miniCardGreen]}>
                  <Text style={styles.miniLabel}>Inflow</Text>
                  <Text style={styles.miniValue}>{fmt(cashFlowToday.cashInflowInPaise)}</Text>
                </View>
                <View style={[styles.miniCard, styles.miniCardRed]}>
                  <Text style={styles.miniLabel}>Outflow</Text>
                  <Text style={styles.miniValue}>{fmt(cashFlowToday.cashOutflowInPaise)}</Text>
                </View>
              </View>
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Net</Text>
                <Text style={[styles.netValue, cashFlowToday.netCashFlowInPaise < 0 && styles.negative]}>
                  {cashFlowToday.netCashFlowInPaise >= 0 ? '+' : ''}{fmt(cashFlowToday.netCashFlowInPaise)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Receivables and payables */}
          {receivablesPayables ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Credit Overview</Text>
              <View style={styles.twoCol}>
                <View style={[styles.miniCard, styles.miniCardGreen]}>
                  <Text style={styles.miniLabel}>Receivables</Text>
                  <Text style={styles.miniValue}>{fmt(receivablesPayables.totalReceivablesInPaise)}</Text>
                  <Text style={styles.miniSub}>{receivablesPayables.customersWithBalance} customers</Text>
                </View>
                <View style={[styles.miniCard, styles.miniCardRed]}>
                  <Text style={styles.miniLabel}>Payables</Text>
                  <Text style={styles.miniValue}>{fmt(receivablesPayables.totalPayablesInPaise)}</Text>
                  <Text style={styles.miniSub}>{receivablesPayables.suppliersWithBalance} suppliers</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Month P&L summary */}
          {monthSummary ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>This Month</Text>
              <View style={styles.twoCol}>
                <View style={[styles.miniCard, styles.miniCardGreen]}>
                  <Text style={styles.miniLabel}>Sales</Text>
                  <Text style={styles.miniValue}>{fmt(monthSummary.salesInPaise)}</Text>
                </View>
                <View style={[styles.miniCard, styles.miniCardRed]}>
                  <Text style={styles.miniLabel}>Expenses</Text>
                  <Text style={styles.miniValue}>{fmt(monthSummary.expensesInPaise)}</Text>
                </View>
              </View>
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Net Profit</Text>
                <View style={styles.netValueRow}>
                  <Text style={[styles.netValue, monthSummary.profitInPaise < 0 && styles.negative]}>
                    {monthSummary.profitInPaise >= 0 ? '+' : ''}{fmt(monthSummary.profitInPaise)}
                  </Text>
                  <Text style={[styles.marginBadge, monthSummary.grossMarginBps < 0 && styles.negative]}>
                    {(monthSummary.grossMarginBps / 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.empty}>No data yet. Record your first sale!</Text>
          )}
        </ScrollView>
      )}

      {activeTab === 'Transactions' && (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
          ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
          renderItem={({ item }) => {
            const isSale = item.type === 'SALE';
            const isExpense = item.type === 'EXPENSE' && item.referenceId != null;
            const isTappable = isSale || isExpense;
            const handlePress = () => {
              if (isSale) setSelectedSaleId(item.id);
              else if (isExpense && item.referenceId) setSelectedExpenseId(item.referenceId);
            };
            const inner = (
              <>
                <View style={styles.txnIcon}>
                  <Text>{txnEmoji(item.type)}</Text>
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnDescription}>{item.description ?? item.type}</Text>
                  <Text style={styles.txnMeta}>{relativeDate(item.date)} · {item.paymentMethod}</Text>
                </View>
                <View style={styles.txnRight}>
                  <Text style={[styles.txnAmount, isInflow(item.type) ? styles.positive : styles.negative]}>
                    {isInflow(item.type) ? '+' : '-'}{fmt(item.amountInPaise)}
                  </Text>
                  {isTappable ? <Text style={styles.chevron}>›</Text> : null}
                </View>
              </>
            );
            if (isTappable) {
              return (
                <TouchableOpacity activeOpacity={0.75} onPress={handlePress} style={styles.txnCard}>
                  {inner}
                </TouchableOpacity>
              );
            }
            return <View style={styles.txnCard}>{inner}</View>;
          }}
        />
      )}

      {selectedSaleId && businessId ? (
        <SaleReceiptScreen
          businessId={businessId}
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
        />
      ) : null}
      {selectedExpenseId && businessId ? (
        <ExpenseDetailScreen
          businessId={businessId}
          expenseId={selectedExpenseId}
          onClose={() => setSelectedExpenseId(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: { padding: Spacing[4], paddingBottom: Spacing[2] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginHorizontal: Spacing[4] },
  tab: { paddingVertical: Spacing[3], marginRight: Spacing[4], borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.brown },
  tabText: { fontSize: Typography.fontSize.sm, color: Colors.muted, fontWeight: Typography.fontWeight.medium },
  tabTextActive: { color: Colors.brown, fontWeight: Typography.fontWeight.semibold },
  listContent: { padding: Spacing[4], gap: Spacing[3] },
  sectionCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border, gap: Spacing[3], ...Shadows.sm,
  },
  sectionTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  twoCol: { flexDirection: 'row', gap: Spacing[3] },
  miniCard: { flex: 1, borderRadius: Radius.md, padding: Spacing[3], gap: 2 },
  miniCardGreen: { backgroundColor: '#EAF3E8' },
  miniCardRed: { backgroundColor: '#FDECEA' },
  miniLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  miniValue: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  miniSub: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  netRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.border },
  netValueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  netLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted, fontWeight: Typography.fontWeight.medium },
  netValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.success },
  marginBadge: { fontSize: Typography.fontSize.xs, color: Colors.success, backgroundColor: '#EAF3E8', paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: Radius.sm },
  txnCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  txnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.ivory, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, gap: 2 },
  txnDescription: { fontSize: Typography.fontSize.base, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  txnMeta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  txnRight: { alignItems: 'flex-end', gap: 2 },
  txnAmount: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  chevron: { fontSize: 18, color: Colors.muted, lineHeight: 18 },
  positive: { color: Colors.success },
  negative: { color: Colors.error },
  empty: { textAlign: 'center', color: Colors.muted, marginTop: Spacing[8], fontSize: Typography.fontSize.sm },
});
