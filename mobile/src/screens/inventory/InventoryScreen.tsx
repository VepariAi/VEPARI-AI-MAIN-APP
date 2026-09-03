import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  priceInPaise: number;
  costPriceInPaise: number;
  stock: number;
  unit: string;
  lowStockThreshold: number | null;
  isActive: boolean;
}

interface Props {
  businessId: string;
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function stockColor(product: Product): string {
  if (product.stock === 0) return Colors.error;
  if (product.lowStockThreshold !== null && product.stock <= product.lowStockThreshold) return Colors.warning;
  return Colors.success;
}

export default function InventoryScreen({ businessId }: Props): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const loadProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getApiClient().listProducts(businessId);
      setProducts(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load products.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const handleAdjustStock = useCallback((product: Product, delta: number) => {
    if (adjustingId) return;
    const newStock = product.stock + delta;
    if (newStock < 0) {
      Alert.alert('Cannot Reduce', 'Stock cannot go below zero.');
      return;
    }
    setAdjustingId(product.id);
    getApiClient().updateProductStock(businessId, product.id, delta)
      .then(updated => {
        setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, stock: updated.stock } : p));
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Stock update failed.';
        Alert.alert('Error', msg);
      })
      .finally(() => setAdjustingId(null));
  }, [businessId, adjustingId]);

  const filtered = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku?.toLowerCase().includes(search.toLowerCase()) ?? false),
      )
    : products;

  const lowStockCount = products.filter(
    p => p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold,
  ).length;

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
        <Text style={styles.title}>Inventory</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{products.length} items</Text>
        </View>
      </View>

      {lowStockCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerText}>⚠️ {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock</Text>
        </View>
      )}

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or SKU…"
          placeholderTextColor={Colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void loadProducts(true)} tintColor={Colors.brown} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search.trim() ? 'No products match your search.' : 'No products yet. Add your first product.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              {item.sku ? <Text style={styles.productSku}>SKU: {item.sku}</Text> : null}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Sell: </Text>
                <Text style={styles.priceValue}>{formatRupees(item.priceInPaise)}</Text>
                {item.costPriceInPaise > 0 && (
                  <>
                    <Text style={styles.priceLabel}>  Cost: </Text>
                    <Text style={styles.priceValue}>{formatRupees(item.costPriceInPaise)}</Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.stockArea}>
              <View style={[styles.stockDot, { backgroundColor: stockColor(item) }]} />
              <Text style={[styles.stockCount, { color: stockColor(item) }]}>
                {item.stock} {item.unit}
              </Text>
              <View style={styles.stockControls}>
                <TouchableOpacity
                  style={styles.stockBtn}
                  onPress={() => handleAdjustStock(item, -1)}
                  disabled={adjustingId === item.id}
                >
                  <Text style={styles.stockBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stockBtn, styles.stockBtnAdd]}
                  onPress={() => handleAdjustStock(item, 1)}
                  disabled={adjustingId === item.id}
                >
                  <Text style={[styles.stockBtnText, styles.stockBtnAddText]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.brown, flex: 1 },
  badge: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  badgeText: { fontSize: Typography.fontSize.xs, color: Colors.brown, fontWeight: Typography.fontWeight.semibold },
  alertBanner: {
    backgroundColor: Colors.warning,
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[2],
    borderRadius: Radius.md,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  alertBannerText: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  searchBar: { paddingHorizontal: Spacing[4], marginBottom: Spacing[2] },
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    color: Colors.brown,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  list: { padding: Spacing[4], paddingTop: 0, gap: Spacing[3] },
  empty: { flex: 1, alignItems: 'center', padding: Spacing[8] },
  emptyText: { color: Colors.muted, fontSize: Typography.fontSize.base, textAlign: 'center' },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.sm,
  },
  productInfo: { flex: 1, gap: 2, marginRight: Spacing[3] },
  productName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  productSku: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  priceLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  priceValue: { fontSize: Typography.fontSize.xs, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  stockArea: { alignItems: 'center', gap: Spacing[1] },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockCount: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold },
  stockControls: { flexDirection: 'row', gap: Spacing[1], marginTop: Spacing[1] },
  stockBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBtnAdd: { borderColor: Colors.brown, backgroundColor: Colors.brown },
  stockBtnText: { fontSize: Typography.fontSize.lg, color: Colors.brown, lineHeight: 22 },
  stockBtnAddText: { color: Colors.ivory },
});
