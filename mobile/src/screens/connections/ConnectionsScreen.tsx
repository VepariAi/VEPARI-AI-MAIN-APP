import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface Provider {
  id: string;
  name: string;
  category: string;
  description: string;
  logoSymbol: string;
  authType: 'OAUTH' | 'API_KEY' | 'WEBHOOK';
  isAvailable: boolean;
  comingSoon: boolean;
}

interface Connection {
  id: string;
  providerId: string;
  providerName: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING';
  connectedAt: string | null;
  lastSyncAt: string | null;
}

type ProviderCategory = 'ACCOUNTING' | 'PAYMENTS' | 'ECOMMERCE' | 'LOGISTICS' | 'BANKING' | 'COMMUNICATION';

const CATEGORY_LABELS: Record<string, string> = {
  ACCOUNTING: 'Accounting',
  PAYMENTS: 'Payments',
  ECOMMERCE: 'E-Commerce',
  LOGISTICS: 'Logistics',
  BANKING: 'Banking',
  COMMUNICATION: 'Communication',
};

const CATEGORY_ORDER: ProviderCategory[] = ['ACCOUNTING', 'PAYMENTS', 'ECOMMERCE', 'LOGISTICS', 'BANKING', 'COMMUNICATION'];

const AUTH_TYPE_LABELS: Record<string, string> = {
  OAUTH: 'OAuth',
  API_KEY: 'API Key',
  WEBHOOK: 'Webhook',
};

export default function ConnectionsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const api = getApiClient();
      const businesses = await api.getMyBusinesses();
      const biz = businesses[0];
      if (!biz) { setLoading(false); setRefreshing(false); return; }

      const [providerList, connList] = await Promise.all([
        api.getConnectionProviders(biz.id) as Promise<Provider[]>,
        api.listConnections(biz.id) as Promise<Connection[]>,
      ]);
      setProviders(providerList);
      setConnections(connList);
    } catch {
      // keep current state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const connectedIds = new Set(connections.map(c => c.providerId));

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    providers: providers.filter(p => p.category === cat),
  })).filter(g => g.providers.length > 0);

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
        <Text style={styles.heading}>Integrations</Text>
        <Text style={styles.subheading}>Connect your business tools</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
      >
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Integrations are coming soon. We are building connections with leading Indian business platforms.
            Email{' '}
            <Text style={styles.noticeLink}>vepariai@gmail.com</Text>
            {' '}to request a specific integration.
          </Text>
        </View>

        {grouped.map(({ category, label, providers: catProviders }) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{label}</Text>
            <View style={styles.card}>
              {catProviders.map((provider, i) => {
                const isConnected = connectedIds.has(provider.id);
                return (
                  <View
                    key={provider.id}
                    style={[styles.providerRow, i > 0 && styles.providerRowBorder]}
                    accessibilityRole="none"
                  >
                    <View style={styles.logoCircle}>
                      <Text style={styles.logoSymbol}>{provider.logoSymbol}</Text>
                    </View>
                    <View style={styles.providerInfo}>
                      <View style={styles.providerNameRow}>
                        <Text style={styles.providerName}>{provider.name}</Text>
                        {provider.comingSoon && !isConnected && (
                          <View style={styles.comingSoonPill}>
                            <Text style={styles.comingSoonText}>Coming Soon</Text>
                          </View>
                        )}
                        {isConnected && (
                          <View style={styles.connectedPill}>
                            <Text style={styles.connectedText}>Connected</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.providerDesc} numberOfLines={2}>{provider.description}</Text>
                      <Text style={styles.authTypeLabel}>{AUTH_TYPE_LABELS[provider.authType] ?? provider.authType}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.supportCard}>
          <Text style={styles.supportText}>
            Missing an integration?{'\n'}
            Email{' '}
            <Text style={styles.supportLink}>vepariai@gmail.com</Text>
            {'\n'}with subject "Integration Request — [Platform Name]"
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
  subheading: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gold,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  noticeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
  },
  noticeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.muted,
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  noticeLink: { color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  section: { gap: Spacing[2] },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing[1],
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  providerRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoSymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brown,
  },
  providerInfo: { flex: 1, gap: 4 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flexWrap: 'wrap' },
  providerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brown,
  },
  comingSoonPill: {
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.muted,
    fontWeight: Typography.fontWeight.medium,
  },
  connectedPill: {
    backgroundColor: '#dcfce7',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  connectedText: {
    fontSize: Typography.fontSize.xs,
    color: '#16a34a',
    fontWeight: Typography.fontWeight.medium,
  },
  providerDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.muted,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  authTypeLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dim ?? Colors.muted,
  },
  supportCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
  },
  supportText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.muted,
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  supportLink: { color: Colors.brown, fontWeight: Typography.fontWeight.medium },
});
