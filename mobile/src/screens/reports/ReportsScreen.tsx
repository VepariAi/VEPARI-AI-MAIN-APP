import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface DayEntry {
  date: string;
  salesInPaise: number;
  expensesInPaise: number;
  profitInPaise: number;
  grossMarginBps: number;
}

interface MonthSummary {
  salesInPaise: number;
  expensesInPaise: number;
  profitInPaise: number;
  grossMarginBps: number;
  periodStart: string;
  periodEnd: string;
}

interface Props {
  businessId: string;
}

function formatRupees(paise: number): string {
  const r = Math.abs(paise) / 100;
  const sign = paise < 0 ? '-' : '';
  if (r >= 100000) return `${sign}₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `${sign}₹${(r / 1000).toFixed(1)}K`;
  return `${sign}₹${r.toFixed(0)}`;
}

function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const PERIOD_OPTIONS: Array<{ label: string; days: number }> = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

export default function ReportsScreen({ businessId }: Props): React.JSX.Element {
  const [period, setPeriod] = useState(30);
  const [monthly, setMonthly] = useState<MonthSummary | null>(null);
  const [series, setSeries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [monthData, seriesData] = await Promise.all([
        getApiClient().getProfitMonth(businessId),
        getApiClient().getProfitSeries(businessId, period),
      ]);
      setMonthly(monthData);
      setSeries(seriesData);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, period]);

  useEffect(() => { void load(); }, [load]);

  // Spark-bar chart: normalize to max in range
  const maxPaise = series.reduce((m, d) => Math.max(m, Math.abs(d.salesInPaise), Math.abs(d.profitInPaise)), 1);
  const BAR_HEIGHT = 80;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
      >
        <Text style={styles.title}>Reports</Text>

        {/* Period picker */}
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.days}
              style={[styles.periodChip, period === opt.days && styles.periodChipActive]}
              onPress={() => setPeriod(opt.days)}
            >
              <Text style={[styles.periodChipText, period === opt.days && styles.periodChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Month summary card */}
        {monthly && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>This Month</Text>
            <View style={styles.summaryRow}>
              <SummaryItem label="Revenue" value={formatRupees(monthly.salesInPaise)} color={Colors.gold} />
              <SummaryItem label="Expenses" value={formatRupees(monthly.expensesInPaise)} color={Colors.terra} />
              <SummaryItem
                label="Profit"
                value={formatRupees(monthly.profitInPaise)}
                color={monthly.profitInPaise >= 0 ? Colors.success : Colors.error}
              />
            </View>
            <View style={styles.marginRow}>
              <Text style={styles.marginLabel}>Gross Margin</Text>
              <Text style={[styles.marginValue, monthly.grossMarginBps < 0 && styles.negativeText]}>
                {bpsToPercent(monthly.grossMarginBps)}
              </Text>
            </View>
          </View>
        )}

        {/* Daily series chart */}
        {series.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Daily Performance ({period}d)</Text>
            <View style={styles.chartWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chart}>
                  {series.map(day => (
                    <View key={day.date} style={styles.barGroup}>
                      {/* Sales bar */}
                      <View style={styles.barPair}>
                        <View
                          style={[
                            styles.bar,
                            styles.barSales,
                            { height: Math.max(2, (day.salesInPaise / maxPaise) * BAR_HEIGHT) },
                          ]}
                        />
                        <View
                          style={[
                            styles.bar,
                            day.profitInPaise >= 0 ? styles.barProfit : styles.barLoss,
                            { height: Math.max(2, (Math.abs(day.profitInPaise) / maxPaise) * BAR_HEIGHT) },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{shortDate(day.date)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.gold }]} />
                  <Text style={styles.legendText}>Sales</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.legendText}>Profit</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                  <Text style={styles.legendText}>Loss</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Per-day table for last 10 days */}
        {series.length > 0 && (
          <View style={styles.tableSection}>
            <Text style={styles.chartTitle}>Daily Breakdown</Text>
            {series.slice(-10).reverse().map(day => (
              <View key={day.date} style={styles.tableRow}>
                <Text style={styles.tableDate}>{shortDate(day.date)}</Text>
                <Text style={styles.tableSales}>{formatRupees(day.salesInPaise)}</Text>
                <Text style={[styles.tableProfit, day.profitInPaise < 0 && styles.negativeText]}>
                  {formatRupees(day.profitInPaise)}
                </Text>
                <Text style={styles.tableMargin}>{bpsToPercent(day.grossMarginBps)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }): React.JSX.Element {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryItemLabel}>{label}</Text>
      <Text style={[styles.summaryItemValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  scroll: { padding: Spacing[4], paddingBottom: 40 },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.brown, marginBottom: Spacing[4] },
  periodRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[4] },
  periodChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  periodChipActive: { borderColor: Colors.brown, backgroundColor: Colors.brown },
  periodChipText: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  periodChipTextActive: { color: Colors.ivory },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing[5],
    marginBottom: Spacing[4],
    ...Shadows.md,
  },
  summaryTitle: { fontSize: Typography.fontSize.sm, color: Colors.muted, marginBottom: Spacing[3] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing[3] },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryItemLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  summaryItemValue: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  marginLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  marginValue: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.semibold },
  negativeText: { color: Colors.error },
  chartSection: { marginBottom: Spacing[4] },
  chartTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown, marginBottom: Spacing[3] },
  chartWrapper: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    ...Shadows.sm,
  },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 100, paddingBottom: 20 },
  barGroup: { alignItems: 'center', gap: 2 },
  barPair: { flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
  bar: { width: 8, borderRadius: 4 },
  barSales: { backgroundColor: Colors.gold },
  barProfit: { backgroundColor: Colors.success },
  barLoss: { backgroundColor: Colors.error },
  barLabel: { fontSize: 8, color: Colors.muted, marginTop: 4 },
  legend: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[3] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  tableSection: { marginBottom: Spacing[4] },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableDate: { fontSize: Typography.fontSize.sm, color: Colors.muted, width: 40 },
  tableSales: { fontSize: Typography.fontSize.sm, color: Colors.brown, width: 80, textAlign: 'right' },
  tableProfit: { fontSize: Typography.fontSize.sm, color: Colors.success, width: 80, textAlign: 'right' },
  tableMargin: { fontSize: Typography.fontSize.sm, color: Colors.muted, width: 50, textAlign: 'right' },
});
