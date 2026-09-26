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

type InsightCategory = 'opportunities' | 'risks' | 'trends' | 'anomalies';

interface Insight {
  type: string;
  severity: string;
  title: string;
  description: string;
}

interface InsightReport {
  trends: Insight[];
  anomalies: Insight[];
  opportunities: Insight[];
  risks: Insight[];
}

interface HealthScore {
  overallScore: number;
  grade: 'healthy' | 'good' | 'fair' | 'at_risk' | 'critical';
  criticalInsightCount: number;
  opportunityCount: number;
  dimensions: Array<{ dimension: string; score: number; grade: string; insightCount: number }>;
}

const TABS: { key: InsightCategory; label: string; emoji: string }[] = [
  { key: 'opportunities', label: 'Opportunities', emoji: '🚀' },
  { key: 'risks', label: 'Risks', emoji: '⚠️' },
  { key: 'trends', label: 'Trends', emoji: '📈' },
  { key: 'anomalies', label: 'Anomalies', emoji: '🔍' },
];

const GRADE_COLOR: Record<HealthScore['grade'], string> = {
  healthy: Colors.success,
  good: '#4CAF50',
  fair: '#FF9800',
  at_risk: '#F44336',
  critical: '#B71C1C',
};

const GRADE_LABEL: Record<HealthScore['grade'], string> = {
  healthy: 'Healthy',
  good: 'Good',
  fair: 'Fair',
  at_risk: 'At Risk',
  critical: 'Critical',
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: Colors.error,
  warning: '#FF9800',
  info: Colors.muted,
};

interface Props {
  businessId: string;
}

export default function InsightsScreen({ businessId }: Props): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<InsightCategory>('opportunities');
  const [report, setReport] = useState<InsightReport | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const client = getApiClient();
      const [insights, score] = await Promise.all([
        client.getInsights(businessId),
        client.getHealthScore(businessId),
      ]);
      setReport(insights);
      setHealthScore(score);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      </SafeAreaView>
    );
  }

  const activeInsights = report ? report[activeTab] : [];
  const gradeColor = healthScore ? GRADE_COLOR[healthScore.grade] : Colors.muted;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
      >
        {/* Health score card */}
        {healthScore ? (
          <View style={[styles.scoreCard, { borderLeftColor: gradeColor }]}>
            <View style={styles.scoreRow}>
              <View>
                <Text style={styles.scoreLabel}>Business Health</Text>
                <Text style={[styles.grade, { color: gradeColor }]}>
                  {GRADE_LABEL[healthScore.grade]}
                </Text>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={[styles.scoreValue, { color: gradeColor }]}>{healthScore.overallScore}</Text>
                <Text style={styles.scoreOf}>/100</Text>
              </View>
            </View>

            {healthScore.criticalInsightCount > 0 ? (
              <Text style={styles.criticalBadge}>
                {healthScore.criticalInsightCount} critical {healthScore.criticalInsightCount === 1 ? 'issue' : 'issues'} need attention
              </Text>
            ) : null}
            {healthScore.opportunityCount > 0 ? (
              <Text style={styles.opportunityBadge}>
                {healthScore.opportunityCount} {healthScore.opportunityCount === 1 ? 'opportunity' : 'opportunities'} available
              </Text>
            ) : null}

            {/* Dimension bars */}
            <View style={styles.dimensions}>
              {healthScore.dimensions.map(dim => (
                <View key={dim.dimension} style={styles.dimRow}>
                  <Text style={styles.dimName}>{dim.dimension}</Text>
                  <View style={styles.dimBar}>
                    <View
                      style={[
                        styles.dimFill,
                        {
                          width: `${dim.score}%` as `${number}%`,
                          backgroundColor: GRADE_COLOR[dim.grade as HealthScore['grade']] ?? Colors.muted,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.dimScore}>{dim.score}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabRow}>
            {TABS.map(({ key, label, emoji }) => {
              const count = report ? report[key].length : 0;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tab, activeTab === key && styles.tabActive]}
                  onPress={() => setActiveTab(key)}
                >
                  <Text style={styles.tabEmoji}>{emoji}</Text>
                  <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                    {label}
                  </Text>
                  {count > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{count}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Insights list */}
        <View style={styles.list}>
          {activeInsights.length === 0 ? (
            <Text style={styles.empty}>No {TABS.find(t => t.key === activeTab)?.label.toLowerCase()} detected.</Text>
          ) : (
            activeInsights.map((insight, i) => (
              <View key={`${activeTab}-${i}`} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[insight.severity] ?? Colors.muted }]} />
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: { padding: Spacing[4], paddingBottom: Spacing[2] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  scroll: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  scoreCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, gap: Spacing[3], ...Shadows.sm,
  },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted, fontWeight: Typography.fontWeight.medium },
  grade: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, marginTop: 2 },
  scoreCircle: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  scoreValue: { fontSize: 40, fontWeight: Typography.fontWeight.bold, lineHeight: 44 },
  scoreOf: { fontSize: Typography.fontSize.sm, color: Colors.muted, marginBottom: 6 },
  criticalBadge: { fontSize: Typography.fontSize.xs, color: Colors.error, backgroundColor: '#FDECEA', paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.sm, alignSelf: 'flex-start' },
  opportunityBadge: { fontSize: Typography.fontSize.xs, color: Colors.success, backgroundColor: '#EAF3E8', paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.sm, alignSelf: 'flex-start' },
  dimensions: { gap: Spacing[2] },
  dimRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  dimName: { fontSize: Typography.fontSize.xs, color: Colors.muted, width: 90 },
  dimBar: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  dimFill: { height: '100%', borderRadius: 3 },
  dimScore: { fontSize: Typography.fontSize.xs, color: Colors.muted, width: 24, textAlign: 'right' },
  tabScroll: { marginHorizontal: -Spacing[4] },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing[4], gap: Spacing[2] },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[1],
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tabActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  tabEmoji: { fontSize: 14 },
  tabText: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  tabTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  badge: { backgroundColor: Colors.gold, borderRadius: 8, minWidth: 16, paddingHorizontal: 4, alignItems: 'center' },
  badgeText: { fontSize: 10, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  list: { gap: Spacing[3] },
  insightCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border, gap: Spacing[2], ...Shadows.sm,
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing[2] },
  insightTitle: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  insightDescription: { fontSize: Typography.fontSize.sm, color: Colors.muted, lineHeight: 20 },
  empty: { textAlign: 'center', color: Colors.muted, marginTop: Spacing[6], fontSize: Typography.fontSize.sm },
});
