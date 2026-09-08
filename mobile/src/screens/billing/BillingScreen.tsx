import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface Plan {
  id: string;
  name: string;
  monthlyPriceInPaise: number;
  annualPriceInPaise: number;
  features: string[];
}

interface Subscription {
  planId: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  priceInPaise: number;
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  TRIALING: '#f59e0b',
  CANCELLED: Colors.error,
  EXPIRED: Colors.muted,
};

export default function BillingScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const api = getApiClient();
      const businesses = await api.getMyBusinesses();
      const biz = businesses[0];
      if (!biz) return;
      setBusinessId(biz.id);

      const [sub, planList] = await Promise.all([
        api.getSubscription(biz.id),
        api.getBillingPlans(biz.id) as Promise<Plan[]>,
      ]);
      setSubscription(sub);
      setPlans(planList);
    } catch {
      // keep current state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Your access continues until the end of the current billing period. Are you sure you want to cancel?',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            if (!businessId) return;
            setActionLoading(true);
            try {
              await getApiClient().cancelSubscription(businessId);
              await load();
            } catch {
              Alert.alert('Error', 'Could not cancel subscription. Please contact support.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleReactivate = async () => {
    if (!businessId) return;
    setActionLoading(true);
    try {
      await getApiClient().reactivateSubscription(businessId);
      await load();
    } catch {
      Alert.alert('Error', 'Could not reactivate subscription. Please contact support.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const currentPlan = plans.find(p => p.id === subscription?.planId);
  const statusColor = subscription ? (STATUS_COLORS[subscription.status] ?? Colors.muted) : Colors.muted;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Billing</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
      >
        {subscription && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Current Plan</Text>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{subscription.status}</Text>
              </View>
            </View>

            <Text style={styles.planName}>{currentPlan?.name ?? subscription.planId}</Text>

            {subscription.trialEndsAt && subscription.status === 'TRIALING' && (
              <Text style={styles.trialNote}>
                Free trial ends {formatDate(subscription.trialEndsAt)}
              </Text>
            )}

            {subscription.priceInPaise > 0 && (
              <Text style={styles.price}>
                {formatRupees(subscription.priceInPaise)} / {subscription.billingCycle === 'ANNUAL' ? 'year' : 'month'}
              </Text>
            )}

            {subscription.nextBillingDate && !subscription.cancelAtPeriodEnd && (
              <Text style={styles.renewNote}>
                Renews on {formatDate(subscription.nextBillingDate)}
              </Text>
            )}

            {subscription.cancelAtPeriodEnd && (
              <Text style={styles.cancelNote}>
                Cancels on {formatDate(subscription.currentPeriodEnd)}. You retain access until then.
              </Text>
            )}

            {subscription.cancelAtPeriodEnd ? (
              <TouchableOpacity
                style={styles.reactivateBtn}
                onPress={() => void handleReactivate()}
                disabled={actionLoading}
                accessibilityLabel="Reactivate subscription"
                accessibilityRole="button"
              >
                {actionLoading ? (
                  <ActivityIndicator color={Colors.gold} />
                ) : (
                  <Text style={styles.reactivateBtnText}>Reactivate Subscription</Text>
                )}
              </TouchableOpacity>
            ) : subscription.planId !== 'FREE' ? (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                disabled={actionLoading}
                accessibilityLabel="Cancel subscription"
                accessibilityRole="button"
              >
                <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {currentPlan && currentPlan.features.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What's included</Text>
            {currentPlan.features.map(f => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Plans</Text>
          {plans.map((plan, i) => (
            <View key={plan.id} style={[styles.planRow, i > 0 && styles.planRowBorder]}>
              <View style={styles.planRowLeft}>
                <Text style={[styles.planRowName, plan.id === subscription?.planId && styles.planRowActive]}>
                  {plan.name}{plan.id === subscription?.planId ? ' (current)' : ''}
                </Text>
                <Text style={styles.planRowPrice}>
                  {plan.monthlyPriceInPaise === 0
                    ? 'Free'
                    : `${formatRupees(plan.monthlyPriceInPaise)}/mo`}
                </Text>
              </View>
            </View>
          ))}
          <Text style={styles.upgradeNote}>
            To upgrade or change your plan, contact us at vepariai@gmail.com
          </Text>
        </View>

        <View style={styles.supportCard}>
          <Text style={styles.supportText}>
            Billing questions? Email{' '}
            <Text style={styles.supportLink}>vepariai@gmail.com</Text>
            {'\n'}with subject "Billing — [Your Phone Number]"
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.ivory },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.brown,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[5],
  },
  backBtn: { marginBottom: Spacing[2] },
  backText: { color: Colors.gold, fontSize: Typography.fontSize.sm },
  heading: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.ivory,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPill: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  planName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brown,
  },
  price: { fontSize: Typography.fontSize.base, color: Colors.brown },
  trialNote: { fontSize: Typography.fontSize.sm, color: '#f59e0b' },
  renewNote: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  cancelNote: { fontSize: Typography.fontSize.sm, color: Colors.error },
  cancelBtn: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  cancelBtnText: { color: Colors.error, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
  reactivateBtn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  reactivateBtnText: { color: Colors.gold, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold },
  featureRow: { flexDirection: 'row', gap: Spacing[2], alignItems: 'flex-start' },
  featureCheck: { color: Colors.brown, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.sm },
  featureText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.brown },
  planRow: { paddingVertical: Spacing[3], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  planRowLeft: { gap: 2 },
  planRowName: { fontSize: Typography.fontSize.base, color: Colors.brown },
  planRowActive: { fontWeight: Typography.fontWeight.semibold },
  planRowPrice: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  upgradeNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.muted,
    marginTop: Spacing[2],
    lineHeight: Typography.fontSize.xs * 1.5,
  },
  supportCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
  },
  supportText: { fontSize: Typography.fontSize.sm, color: Colors.muted, lineHeight: Typography.fontSize.sm * 1.5 },
  supportLink: { color: Colors.brown, fontWeight: Typography.fontWeight.medium },
});
