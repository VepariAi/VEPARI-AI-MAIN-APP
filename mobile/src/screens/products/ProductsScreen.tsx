import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
  const r = Math.abs(paise) / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(2)}`;
}

function isLowStock(p: Product): boolean {
  return p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold;
}

export default function ProductsScreen({ businessId }: Props): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addCost, setAddCost] = useState('');
  const [addSku, setAddSku] = useState('');
  const [addUnit, setAddUnit] = useState('pcs');
  const [addStock, setAddStock] = useState('0');
  const [addThreshold, setAddThreshold] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getApiClient().listProducts(businessId);
      setProducts(data);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    const priceRupees = parseFloat(addPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(priceRupees) || priceRupees < 0) {
      Alert.alert('Invalid Price', 'Enter a valid selling price.');
      return;
    }
    const priceInPaise = Math.round(priceRupees * 100);
    const costRupees = parseFloat(addCost.replace(/[^0-9.]/g, ''));
    const costInPaise = !isNaN(costRupees) && costRupees >= 0 ? Math.round(costRupees * 100) : undefined;
    const initialStock = parseInt(addStock, 10);
    const threshold = parseInt(addThreshold, 10);

    setAdding(true);
    try {
      const created = await getApiClient().createProduct(businessId, {
        name: addName.trim(),
        priceInPaise,
        ...(addSku.trim() ? { sku: addSku.trim() } : {}),
        ...(addUnit.trim() ? { unit: addUnit.trim() } : {}),
        ...(costInPaise !== undefined ? { costPriceInPaise: costInPaise } : {}),
        ...(initialStock > 0 ? { stock: initialStock } : {}),
        ...(!isNaN(threshold) && threshold > 0 ? { lowStockThreshold: threshold } : {}),
      });
      setProducts(prev => [{ ...created, isActive: true }, ...prev]);
      setShowAdd(false);
      setAddName(''); setAddPrice(''); setAddCost(''); setAddSku('');
      setAddUnit('pcs'); setAddStock('0'); setAddThreshold('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create product.';
      Alert.alert('Error', msg);
    } finally {
      setAdding(false);
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? '').toLowerCase().includes(q)
    );
  });

  const lowStockCount = products.filter(isLowStock).length;

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
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or SKU..."
          placeholderTextColor={Colors.dim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{products.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        {lowStockCount > 0 && (
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: Colors.error }]}>{lowStockCount}</Text>
            <Text style={styles.summaryLabel}>Low Stock</Text>
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
        ListEmptyComponent={<Text style={styles.empty}>{search ? 'No results' : 'No products yet. Add your first one!'}</Text>}
        renderItem={({ item }) => {
          const low = isLowStock(item);
          return (
            <View style={[styles.card, low && styles.cardLowStock]}>
              <View style={styles.cardMain}>
                <View style={styles.cardTop}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  {low && <View style={styles.lowBadge}><Text style={styles.lowBadgeText}>Low</Text></View>}
                </View>
                <View style={styles.cardMeta}>
                  {item.sku ? <Text style={styles.sku}>SKU: {item.sku}</Text> : null}
                  <Text style={styles.stock}>
                    Stock: <Text style={[styles.stockVal, low && styles.stockValLow]}>{item.stock}</Text> {item.unit}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.price}>{formatRupees(item.priceInPaise)}</Text>
                {item.costPriceInPaise > 0 && (
                  <Text style={styles.costPrice}>Cost: {formatRupees(item.costPriceInPaise)}</Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Add product modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>New Product</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Product name *"
              placeholderTextColor={Colors.dim}
              value={addName}
              onChangeText={setAddName}
              autoFocus
            />
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="Selling price ₹ *"
                placeholderTextColor={Colors.dim}
                value={addPrice}
                onChangeText={setAddPrice}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="Cost price ₹"
                placeholderTextColor={Colors.dim}
                value={addCost}
                onChangeText={setAddCost}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="SKU (optional)"
                placeholderTextColor={Colors.dim}
                value={addSku}
                onChangeText={setAddSku}
                autoCapitalize="characters"
              />
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="Unit (pcs)"
                placeholderTextColor={Colors.dim}
                value={addUnit}
                onChangeText={setAddUnit}
              />
            </View>
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="Opening stock"
                placeholderTextColor={Colors.dim}
                value={addStock}
                onChangeText={setAddStock}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="Low stock alert"
                placeholderTextColor={Colors.dim}
                value={addThreshold}
                onChangeText={setAddThreshold}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!addName.trim() || !addPrice.trim() || adding) && styles.saveBtnDisabled]}
                onPress={() => void handleAdd()}
                disabled={!addName.trim() || !addPrice.trim() || adding}
              >
                {adding
                  ? <ActivityIndicator color={Colors.ivory} size="small" />
                  : <Text style={styles.saveBtnText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[4], paddingBottom: Spacing[2] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  addBtn: { backgroundColor: Colors.brown, borderRadius: Radius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  addBtnText: { color: Colors.gold, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing[4], marginBottom: Spacing[2], backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing[3] },
  searchIcon: { fontSize: 16, marginRight: Spacing[2] },
  searchInput: { flex: 1, paddingVertical: Spacing[3], fontSize: Typography.fontSize.base, color: Colors.brown },
  summary: { flexDirection: 'row', gap: Spacing[4], paddingHorizontal: Spacing[4], marginBottom: Spacing[3] },
  summaryItem: { gap: 2 },
  summaryVal: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  summaryLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  list: { paddingHorizontal: Spacing[4], gap: Spacing[2], paddingBottom: 20 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardLowStock: { borderColor: Colors.error, borderWidth: 1.5 },
  cardMain: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  productName: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  lowBadge: { backgroundColor: Colors.error, borderRadius: Radius.sm, paddingHorizontal: Spacing[2], paddingVertical: 2 },
  lowBadgeText: { fontSize: Typography.fontSize.xs, color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  cardMeta: { flexDirection: 'row', gap: Spacing[3] },
  sku: { fontSize: Typography.fontSize.xs, color: Colors.dim },
  stock: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  stockVal: { fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  stockValLow: { color: Colors.error },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  costPrice: { fontSize: Typography.fontSize.xs, color: Colors.muted },

  empty: { textAlign: 'center', color: Colors.muted, marginTop: Spacing[8], fontSize: Typography.fontSize.sm },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing[5], gap: Spacing[3] },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  modalInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[3], fontSize: Typography.fontSize.base, color: Colors.brown },
  modalRow: { flexDirection: 'row', gap: Spacing[2] },
  modalHalf: { flex: 1 },
  modalBtns: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[1] },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center' },
  cancelBtnText: { color: Colors.muted, fontSize: Typography.fontSize.base },
  saveBtn: { flex: 1, backgroundColor: Colors.brown, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.ivory, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
});
