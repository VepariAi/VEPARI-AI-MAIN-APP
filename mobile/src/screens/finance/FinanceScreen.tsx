import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';

const TABS = ['Overview', 'Transactions', 'Expenses'] as const;
type Tab = typeof TABS[number];

// Placeholder — replace with real API data
const TRANSACTIONS = [
  { id: '1', type: 'SALE', description: 'Rice & dal sale', amountInPaise: 45000, date: 'Today 2:30 PM', paymentMethod: 'CASH' },
  { id: '2', type: 'EXPENSE', description: 'Electricity bill', amountInPaise: 180000, date: 'Today 10:00 AM', paymentMethod: 'BANK_TRANSFER' },
  { id: '3', type: 'SALE', description: 'Groceries — Priya', amountInPaise: 32000, date: 'Yesterday 4:00 PM', paymentMethod: 'UPI' },
  { id: '4', type: 'PURCHASE', description: 'Stock replenishment', amountInPaise: 560000, date: 'Yesterday 9:00 AM', paymentMethod: 'BANK_TRANSFER' },
];

function fmt(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function FinanceScreen(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finance</Text>
      </View>

      {/* Tabs */}
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

      {activeTab === 'Overview' && <OverviewTab />}
      {activeTab === 'Transactions' && (
        <FlatList
          data={TRANSACTIONS}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.txnCard}>
              <View style={styles.txnIcon}>
                <Text>{item.type === 'SALE' ? '💰' : item.type === 'EXPENSE' ? '💸' : '🛒'}</Text>
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnDescription}>{item.description}</Text>
                <Text style={styles.txnMeta}>{item.date} · {item.paymentMethod}</Text>
              </View>
              <Text style={[
                styles.txnAmount,
                item.type === 'SALE' ? styles.positive : styles.negative,
              ]}>
                {item.type === 'SALE' ? '+' : '-'}{fmt(item.amountInPaise)}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function OverviewTab(): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>This Month</Text>
        <Text style={styles.summaryValue}>{fmt(1285000)}</Text>
        <Text style={styles.summarySubLabel}>Total Revenue</Text>
      </View>

      <View style={styles.twoCol}>
        <View style={[styles.miniCard, styles.miniCardGreen]}>
          <Text style={styles.miniLabel}>Sales</Text>
          <Text style={styles.miniValue}>{fmt(1285000)}</Text>
        </View>
        <View style={[styles.miniCard, styles.miniCardRed]}>
          <Text style={styles.miniLabel}>Expenses</Text>
          <Text style={styles.miniValue}>{fmt(420000)}</Text>
        </View>
      </View>

      <View style={styles.profitCard}>
        <Text style={styles.profitLabel}>Net Profit</Text>
        <Text style={styles.profitValue}>{fmt(865000)}</Text>
        <Text style={styles.profitMargin}>67.5% margin</Text>
      </View>
    </ScrollView>
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
  txnCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border },
  txnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.beige, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, gap: 2 },
  txnDescription: { fontSize: Typography.fontSize.base, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  txnMeta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  txnAmount: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  positive: { color: Colors.success },
  negative: { color: Colors.error },
  summaryCard: { backgroundColor: Colors.brown, borderRadius: Radius.xl, padding: Spacing[6], alignItems: 'center', gap: Spacing[1] },
  summaryLabel: { color: Colors.dim, fontSize: Typography.fontSize.sm },
  summaryValue: { color: Colors.gold, fontSize: Typography.fontSize['3xl'], fontWeight: Typography.fontWeight.bold },
  summarySubLabel: { color: Colors.dim, fontSize: Typography.fontSize.sm },
  twoCol: { flexDirection: 'row', gap: Spacing[3] },
  miniCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing[4], gap: Spacing[1] },
  miniCardGreen: { backgroundColor: '#EAF3E8' },
  miniCardRed: { backgroundColor: '#FDECEA' },
  miniLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  miniValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  profitCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: Spacing[1] },
  profitLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  profitValue: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.success },
  profitMargin: { fontSize: Typography.fontSize.sm, color: Colors.success },
});
