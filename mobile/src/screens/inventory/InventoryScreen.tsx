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
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';
import ProductDetailScreen from '@/screens/products/ProductDetailScreen';

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

type StockFilter = 'all' | 'low' | 'out';

const ADJUST_REASONS = [
  'New purchase received',
  'Returned by customer',
  'Opening stock entry',
  'Damaged / expired',
  'Stolen / lost',
  'Counting correction',
  'Sample / internal use',
  'Other',
];

function stockStatus(p: Product): 'out' | 'low' | 'ok' {
  if (p.stock === 0) return 'out';
  if (p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold) return 'low';
  return 'ok';
}

export default function InventoryScreen({ businessId }: Props): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [detailProduct, setDetailProduct] = useState<{ id: string; name: string } | null>(null);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustProductName, setAdjustProductName] = useState('');
  const [adjustProductSearch, setAdjustProductSearch] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustDirection, setAdjustDirection] = useState<'add' | 'remove'>('add');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustOther, setAdjustOther] = useState('');
  const [adjusting, setAdjusting] = useState(false);

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

  const openAdjust = (p?: Product) => {
    setAdjustProductId(p?.id ?? '');
    setAdjustProductName(p?.name ?? '');
    setAdjustProductSearch('');
    setAdjustQty('');
    setAdjustDirection('add');
    setAdjustReason('');
    setAdjustOther('');
    setShowAdjust(true);
  };

  const handleAdjust = async () => {
    if (!adjustProductId) {
      Alert.alert('Select a product', 'Choose a product to adjust.');
      return;
    }
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Enter a positive adjustment quantity.');
      return;
    }
    const reason = adjustReason === 'Other' ? adjustOther.trim() : adjustReason;
    if (!reason) {
      Alert.alert('Reason required', 'Select a reason for this adjustment.');
      return;
    }
    const delta = adjustDirection === 'add' ? qty : -qty;

    setAdjusting(true);
    try {
      const result = await getApiClient().updateProductStock(businessId, adjustProductId, delta);
      setProducts(prev => prev.map(p => p.id === adjustProductId ? { ...p, stock: result.stock } : p));
      setShowAdjust(false);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to adjust stock.');
    } finally {
      setAdjusting(false);
    }
  };

  const inStockCount = products.filter(p => p.stock > 0).length;
  const lowStockProducts = products.filter(p => stockStatus(p) === 'low');
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'low' ? stockStatus(p) === 'low' :
      filter === 'out' ? p.stock === 0 : true;
    return matchSearch && matchFilter;
  });

  const adjustProductOptions = products.filter(p => {
    const q = adjustProductSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q);
  });

  const selectedProduct = products.find(p => p.id === adjustProductId);
  const adjustedQtyNum = parseInt(adjustQty, 10);
  const newStock = selectedProduct
    ? adjustDirection === 'add'
      ? selectedProduct.stock + (isNaN(adjustedQtyNum) ? 0 : adjustedQtyNum)
      : selectedProduct.stock - (isNaN(adjustedQtyNum) ? 0 : adjustedQtyNum)
    : null;

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
        <TouchableOpacity style={styles.adjustBtn} onPress={() => openAdjust()}>
          <Text style={styles.adjustBtnText}>+ Adjust</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
        ListHeaderComponent={(
          <>
            {/* Stock Health */}
            <View style={styles.healthRow}>
              <TouchableOpacity style={styles.healthChip} onPress={() => setFilter('all')}>
                <Text style={styles.healthVal}>{inStockCount}</Text>
                <Text style={styles.healthLabel}>In stock</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.healthChip, lowStockProducts.length > 0 && styles.healthChipWarn]}
                onPress={() => setFilter('low')}
              >
                <Text style={[styles.healthVal, lowStockProducts.length > 0 && { color: Colors.warning }]}>
                  {lowStockProducts.length}
                </Text>
                <Text style={styles.healthLabel}>Low stock</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.healthChip, outOfStockProducts.length > 0 && styles.healthChipError]}
                onPress={() => setFilter('out')}
              >
                <Text style={[styles.healthVal, outOfStockProducts.length > 0 && { color: Colors.error }]}>
                  {outOfStockProducts.length}
                </Text>
                <Text style={styles.healthLabel}>Out of stock</Text>
              </TouchableOpacity>
            </View>

            {/* Alert banner */}
            {outOfStockProducts.length > 0 && (
              <TouchableOpacity style={styles.alertBanner} onPress={() => setFilter('out')}>
                <Text style={styles.alertBannerText}>
                  🔴 {outOfStockProducts.length} product{outOfStockProducts.length > 1 ? 's' : ''} out of stock — tap to view
                </Text>
              </TouchableOpacity>
            )}

            {/* Low stock spotlight */}
            {lowStockProducts.length > 0 && filter === 'all' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Low Stock Alert</Text>
                {lowStockProducts.slice(0, 3).map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.lowStockRow}
                    onPress={() => setDetailProduct({ id: p.id, name: p.name })}
                  >
                    <View style={styles.lowStockInfo}>
                      <Text style={styles.lowStockName}>{p.name}</Text>
                      <Text style={styles.lowStockMeta}>
                        {p.stock} / min {p.lowStockThreshold} {p.unit}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.quickAdjustBtn} onPress={() => openAdjust(p)}>
                      <Text style={styles.quickAdjustBtnText}>Adjust</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
                {lowStockProducts.length > 3 && (
                  <TouchableOpacity style={styles.seeAll} onPress={() => setFilter('low')}>
                    <Text style={styles.seeAllText}>See all {lowStockProducts.length} low-stock products →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Search + filter tabs */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products…"
                placeholderTextColor={Colors.dim}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <View style={styles.filterTabs}>
              {(['all', 'low', 'out'] as StockFilter[]).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterTab, filter === f && styles.filterTabActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                    {f === 'all' ? 'All' : f === 'low' ? 'Low stock' : 'Out of stock'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search ? 'No results' : filter !== 'all' ? 'No products in this filter' : 'No products tracked yet. Add products first.'}
          </Text>
        }
        renderItem={({ item }) => {
          const status = stockStatus(item);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => setDetailProduct({ id: item.id, name: item.name })}
            >
              <View style={styles.cardMain}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                {item.sku ? <Text style={styles.sku}>SKU: {item.sku}</Text> : null}
                {status === 'low' && (
                  <Text style={styles.lowText}>⚠ Below reorder level (min: {item.lowStockThreshold})</Text>
                )}
                {status === 'out' && (
                  <Text style={styles.outText}>🔴 Out of stock</Text>
                )}
              </View>
              <View style={styles.cardRight}>
                <Text style={[
                  styles.stockVal,
                  status === 'out' && { color: Colors.error },
                  status === 'low' && { color: Colors.warning },
                ]}>
                  {item.stock}
                </Text>
                <Text style={styles.stockUnit}>{item.unit}</Text>
                <TouchableOpacity style={styles.inlineAdjust} onPress={() => openAdjust(item)}>
                  <Text style={styles.inlineAdjustText}>Adjust</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Product detail modal */}
      {detailProduct && (
        <Modal visible animationType="slide" onRequestClose={() => setDetailProduct(null)}>
          <ProductDetailScreen
            businessId={businessId}
            productId={detailProduct.id}
            productName={detailProduct.name}
            onClose={() => setDetailProduct(null)}
            onRefreshParent={() => void load()}
          />
        </Modal>
      )}

      {/* Adjustment modal */}
      <Modal visible={showAdjust} animationType="slide" transparent onRequestClose={() => setShowAdjust(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.modalSheet} contentContainerStyle={{ gap: Spacing[3], paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Stock Adjustment</Text>

            {/* Product selector */}
            {!adjustProductId ? (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Search product…"
                  placeholderTextColor={Colors.dim}
                  value={adjustProductSearch}
                  onChangeText={setAdjustProductSearch}
                  autoFocus
                />
                {adjustProductOptions.slice(0, 5).map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.productOption}
                    onPress={() => { setAdjustProductId(p.id); setAdjustProductName(p.name); }}
                  >
                    <Text style={styles.productOptionName}>{p.name}</Text>
                    <Text style={styles.productOptionStock}>Stock: {p.stock} {p.unit}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <View style={styles.selectedProduct}>
                  <View style={styles.selectedProductInfo}>
                    <Text style={styles.selectedProductName}>{adjustProductName}</Text>
                    {selectedProduct && (
                      <Text style={styles.selectedProductStock}>
                        Current: {selectedProduct.stock} {selectedProduct.unit}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => { setAdjustProductId(''); setAdjustProductName(''); }}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Direction */}
                <View style={styles.directionRow}>
                  <TouchableOpacity
                    style={[styles.dirBtn, adjustDirection === 'add' && styles.dirBtnActive]}
                    onPress={() => setAdjustDirection('add')}
                  >
                    <Text style={[styles.dirBtnText, adjustDirection === 'add' && styles.dirBtnTextActive]}>+ Add stock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dirBtn, adjustDirection === 'remove' && styles.dirBtnActiveRed]}
                    onPress={() => setAdjustDirection('remove')}
                  >
                    <Text style={[styles.dirBtnText, adjustDirection === 'remove' && styles.dirBtnTextActive]}>− Remove</Text>
                  </TouchableOpacity>
                </View>

                {/* Quantity */}
                <TextInput
                  style={styles.modalInput}
                  placeholder="Quantity"
                  placeholderTextColor={Colors.dim}
                  value={adjustQty}
                  onChangeText={setAdjustQty}
                  keyboardType="numeric"
                />
                {newStock !== null && !isNaN(adjustedQtyNum) && adjustedQtyNum > 0 && (
                  <Text style={[styles.newStockPreview, newStock < 0 && { color: Colors.error }]}>
                    New stock: {newStock < 0 ? 'Below zero — not allowed' : `${newStock} ${selectedProduct?.unit ?? ''}`}
                  </Text>
                )}

                {/* Reason */}
                <Text style={styles.reasonLabel}>Reason *</Text>
                <View style={styles.reasonGrid}>
                  {ADJUST_REASONS.map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.reasonChip, adjustReason === r && styles.reasonChipActive]}
                      onPress={() => setAdjustReason(r)}
                    >
                      <Text style={[styles.reasonChipText, adjustReason === r && styles.reasonChipTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {adjustReason === 'Other' && (
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Describe reason (min 5 chars)"
                    placeholderTextColor={Colors.dim}
                    value={adjustOther}
                    onChangeText={setAdjustOther}
                  />
                )}
              </>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdjust(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              {adjustProductId && (
                <TouchableOpacity
                  style={[styles.saveBtn,
                    (!adjustQty.trim() || !adjustReason || (adjustReason === 'Other' && adjustOther.trim().length < 5) || adjusting || (newStock !== null && newStock < 0)) && styles.saveBtnDisabled,
                  ]}
                  onPress={() => void handleAdjust()}
                  disabled={!adjustQty.trim() || !adjustReason || (adjustReason === 'Other' && adjustOther.trim().length < 5) || adjusting || (newStock !== null && newStock < 0)}
                >
                  {adjusting
                    ? <ActivityIndicator color={Colors.ivory} size="small" />
                    : <Text style={styles.saveBtnText}>Confirm</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[4], paddingBottom: Spacing[2] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  adjustBtn: { backgroundColor: Colors.brown, borderRadius: Radius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  adjustBtnText: { color: Colors.gold, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },

  list: { paddingHorizontal: Spacing[4], paddingBottom: 20, gap: Spacing[2] },

  healthRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[3] },
  healthChip: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[3], alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 2 },
  healthChipWarn: { borderColor: Colors.warning, backgroundColor: '#FFFBEB' },
  healthChipError: { borderColor: Colors.error, backgroundColor: '#FFF5F5' },
  healthVal: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  healthLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },

  alertBanner: { backgroundColor: '#FFF5F5', borderRadius: Radius.md, padding: Spacing[3], borderWidth: 1, borderColor: Colors.error, marginBottom: Spacing[2] },
  alertBannerText: { fontSize: Typography.fontSize.sm, color: Colors.error, fontWeight: Typography.fontWeight.medium },

  section: { marginBottom: Spacing[3] },
  sectionTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing[2] },
  lowStockRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing[3], borderWidth: 1, borderColor: Colors.warning, marginBottom: Spacing[1], ...Shadows.sm },
  lowStockInfo: { flex: 1 },
  lowStockName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  lowStockMeta: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  quickAdjustBtn: { backgroundColor: Colors.brown, borderRadius: Radius.sm, paddingHorizontal: Spacing[2], paddingVertical: Spacing[1] },
  quickAdjustBtnText: { fontSize: Typography.fontSize.xs, color: Colors.gold, fontWeight: Typography.fontWeight.semibold },
  seeAll: { paddingVertical: Spacing[2] },
  seeAllText: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing[3], marginBottom: Spacing[2] },
  searchIcon: { fontSize: 16, marginRight: Spacing[2] },
  searchInput: { flex: 1, paddingVertical: Spacing[3], fontSize: Typography.fontSize.base, color: Colors.brown },

  filterTabs: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[2] },
  filterTab: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  filterTabActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  filterTabText: { fontSize: Typography.fontSize.xs, color: Colors.muted, fontWeight: Typography.fontWeight.medium },
  filterTabTextActive: { color: Colors.ivory },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[3], borderWidth: 1, borderColor: Colors.border, gap: Spacing[2], ...Shadows.sm },
  cardMain: { flex: 1, gap: 2 },
  productName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  sku: { fontSize: Typography.fontSize.xs, color: Colors.dim },
  lowText: { fontSize: Typography.fontSize.xs, color: Colors.warning },
  outText: { fontSize: Typography.fontSize.xs, color: Colors.error },
  cardRight: { alignItems: 'center', gap: 2 },
  stockVal: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  stockUnit: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  inlineAdjust: { backgroundColor: Colors.ivory, borderRadius: Radius.sm, paddingHorizontal: Spacing[2], paddingVertical: 2, borderWidth: 1, borderColor: Colors.border, marginTop: 2 },
  inlineAdjustText: { fontSize: Typography.fontSize.xs, color: Colors.brown, fontWeight: Typography.fontWeight.medium },

  empty: { textAlign: 'center', color: Colors.muted, marginTop: Spacing[8], fontSize: Typography.fontSize.sm },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing[5], maxHeight: '85%' },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  modalInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[3], fontSize: Typography.fontSize.base, color: Colors.brown },

  productOption: { backgroundColor: Colors.ivory, borderRadius: Radius.md, padding: Spacing[3], borderWidth: 1, borderColor: Colors.border },
  productOptionName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  productOptionStock: { fontSize: Typography.fontSize.xs, color: Colors.muted },

  selectedProduct: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.beige, borderRadius: Radius.md, padding: Spacing[3] },
  selectedProductInfo: { flex: 1 },
  selectedProductName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  selectedProductStock: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  changeText: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },

  directionRow: { flexDirection: 'row', gap: Spacing[2] },
  dirBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center' },
  dirBtnActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  dirBtnActiveRed: { backgroundColor: Colors.error, borderColor: Colors.error },
  dirBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.muted },
  dirBtnTextActive: { color: Colors.white },

  newStockPreview: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.semibold },

  reasonLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  reasonChip: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  reasonChipActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  reasonChipText: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  reasonChipTextActive: { color: Colors.ivory },

  modalBtns: { flexDirection: 'row', gap: Spacing[3] },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center' },
  cancelBtnText: { color: Colors.muted, fontSize: Typography.fontSize.base },
  saveBtn: { flex: 1, backgroundColor: Colors.brown, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.ivory, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
});
