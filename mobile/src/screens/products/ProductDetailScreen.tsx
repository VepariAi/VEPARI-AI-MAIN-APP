import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface Props {
  businessId: string;
  productId: string;
  productName: string;
  onClose: () => void;
  onRefreshParent: () => void;
}

interface ProductDetail {
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

function formatRupees(paise: number): string {
  const r = Math.abs(paise) / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(2)}`;
}

function marginPercent(price: number, cost: number): string {
  if (cost <= 0 || price <= 0) return '—';
  return `${(((price - cost) / price) * 100).toFixed(1)}%`;
}

export default function ProductDetailScreen({ businessId, productId, productName, onClose, onRefreshParent }: Props): React.JSX.Element {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getApiClient().getProductById(businessId, productId);
      setProduct(p);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [businessId, productId]);

  useEffect(() => { void load(); }, [load]);

  const openEdit = () => {
    if (!product) return;
    setEditName(product.name);
    setEditPrice((product.priceInPaise / 100).toFixed(2));
    setEditCost(product.costPriceInPaise > 0 ? (product.costPriceInPaise / 100).toFixed(2) : '');
    setEditSku(product.sku ?? '');
    setEditUnit(product.unit);
    setEditThreshold(product.lowStockThreshold !== null ? String(product.lowStockThreshold) : '');
    setShowEdit(true);
  };

  const handleAdjust = async () => {
    const qty = parseInt(adjustQty.trim(), 10);
    if (isNaN(qty) || qty === 0) {
      Alert.alert('Invalid Quantity', 'Enter a non-zero quantity. Use negative to remove stock.');
      return;
    }
    setAdjusting(true);
    try {
      const result = await getApiClient().updateProductStock(businessId, productId, qty);
      setProduct(prev => prev ? { ...prev, stock: result.stock } : prev);
      setShowAdjust(false);
      setAdjustQty('');
      setAdjustNote('');
      onRefreshParent();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to adjust stock.');
    } finally {
      setAdjusting(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    const priceRupees = parseFloat(editPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(priceRupees) || priceRupees < 0) {
      Alert.alert('Invalid Price', 'Enter a valid selling price.');
      return;
    }
    const priceInPaise = Math.round(priceRupees * 100);
    const costRupees = parseFloat(editCost.replace(/[^0-9.]/g, ''));
    const costInPaise = !isNaN(costRupees) && costRupees >= 0 ? Math.round(costRupees * 100) : 0;
    const threshold = parseInt(editThreshold, 10);

    setSaving(true);
    try {
      const updated = await getApiClient().updateProduct(businessId, productId, {
        name: editName.trim(),
        priceInPaise,
        ...(editSku.trim() ? { sku: editSku.trim() } : { sku: null }),
        ...(editUnit.trim() ? { unit: editUnit.trim() } : {}),
        costPriceInPaise: costInPaise,
        lowStockThreshold: !isNaN(threshold) && threshold > 0 ? threshold : null,
      });
      setProduct(updated);
      setShowEdit(false);
      onRefreshParent();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{productName}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Product</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.errorText}>Could not load product.</Text>
      </SafeAreaView>
    );
  }

  const isLow = product.lowStockThreshold !== null && product.stock <= product.lowStockThreshold;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{product.name[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.productNameBig}>{product.name}</Text>
            <View style={styles.identityMeta}>
              {product.sku ? <Text style={styles.skuText}>SKU: {product.sku}</Text> : null}
              <Text style={styles.unitText}>Unit: {product.unit}</Text>
            </View>
            {!product.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactive</Text>
              </View>
            )}
          </View>
        </View>

        {/* Price card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Pricing</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceVal}>{formatRupees(product.priceInPaise)}</Text>
              <Text style={styles.priceItemLabel}>Selling Price</Text>
            </View>
            {product.costPriceInPaise > 0 && (
              <>
                <View style={styles.priceDivider} />
                <View style={styles.priceItem}>
                  <Text style={styles.priceVal}>{formatRupees(product.costPriceInPaise)}</Text>
                  <Text style={styles.priceItemLabel}>Cost Price</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceItem}>
                  <Text style={[styles.priceVal, { color: Colors.success }]}>
                    {marginPercent(product.priceInPaise, product.costPriceInPaise)}
                  </Text>
                  <Text style={styles.priceItemLabel}>Margin</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Stock card */}
        <View style={[styles.card, isLow && styles.cardLow]}>
          <Text style={styles.cardLabel}>Stock</Text>
          <View style={styles.stockRow}>
            <View style={styles.priceItem}>
              <Text style={[styles.priceVal, isLow && { color: Colors.error }]}>
                {product.stock}
              </Text>
              <Text style={styles.priceItemLabel}>{product.unit} on hand</Text>
            </View>
            {product.lowStockThreshold !== null && (
              <>
                <View style={styles.priceDivider} />
                <View style={styles.priceItem}>
                  <Text style={styles.priceVal}>{product.lowStockThreshold}</Text>
                  <Text style={styles.priceItemLabel}>Alert threshold</Text>
                </View>
              </>
            )}
          </View>
          {isLow && (
            <View style={styles.lowBanner}>
              <Text style={styles.lowBannerText}>⚠️ Stock is at or below alert threshold</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setAdjustQty(''); setAdjustNote(''); setShowAdjust(true); }}>
            <Text style={styles.actionBtnEmoji}>📦</Text>
            <Text style={styles.actionBtnText}>Adjust Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={openEdit}>
            <Text style={styles.actionBtnEmoji}>✏️</Text>
            <Text style={styles.actionBtnText}>Edit Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Adjust Stock Modal */}
      <Modal visible={showAdjust} animationType="slide" transparent onRequestClose={() => setShowAdjust(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Adjust Stock</Text>
            <Text style={styles.modalHint}>
              Current stock: <Text style={{ fontWeight: Typography.fontWeight.bold }}>{product.stock} {product.unit}</Text>
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Quantity (e.g. 10 to add, -5 to remove)"
              placeholderTextColor={Colors.dim}
              value={adjustQty}
              onChangeText={setAdjustQty}
              keyboardType="numbers-and-punctuation"
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Reason (optional)"
              placeholderTextColor={Colors.dim}
              value={adjustNote}
              onChangeText={setAdjustNote}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdjust(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!adjustQty.trim() || adjusting) && styles.saveBtnDisabled]}
                onPress={() => void handleAdjust()}
                disabled={!adjustQty.trim() || adjusting}
              >
                {adjusting
                  ? <ActivityIndicator color={Colors.ivory} size="small" />
                  : <Text style={styles.saveBtnText}>Apply</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Product Modal */}
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Product name *"
              placeholderTextColor={Colors.dim}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="Selling price ₹ *"
                placeholderTextColor={Colors.dim}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="Cost price ₹"
                placeholderTextColor={Colors.dim}
                value={editCost}
                onChangeText={setEditCost}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="SKU"
                placeholderTextColor={Colors.dim}
                value={editSku}
                onChangeText={setEditSku}
                autoCapitalize="characters"
              />
              <TextInput
                style={[styles.modalInput, styles.modalHalf]}
                placeholder="Unit"
                placeholderTextColor={Colors.dim}
                value={editUnit}
                onChangeText={setEditUnit}
              />
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Low stock alert threshold"
              placeholderTextColor={Colors.dim}
              value={editThreshold}
              onChangeText={setEditThreshold}
              keyboardType="numeric"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!editName.trim() || !editPrice.trim() || saving) && styles.saveBtnDisabled]}
                onPress={() => void handleSave()}
                disabled={!editName.trim() || !editPrice.trim() || saving}
              >
                {saving
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
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], paddingBottom: Spacing[3], gap: Spacing[2] },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 18, color: Colors.muted },
  title: { flex: 1, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  headerSpacer: { width: 56 },
  editBtn: { backgroundColor: Colors.brown, borderRadius: Radius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  editBtnText: { color: Colors.gold, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  errorText: { textAlign: 'center', color: Colors.muted, marginTop: 60 },
  scroll: { padding: Spacing[4], gap: Spacing[3], paddingBottom: 32 },

  identityCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  avatar: { width: 52, height: 52, borderRadius: 10, backgroundColor: Colors.beige, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  identityInfo: { flex: 1, gap: 4 },
  productNameBig: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  identityMeta: { flexDirection: 'row', gap: Spacing[3], flexWrap: 'wrap' },
  skuText: { fontSize: Typography.fontSize.xs, color: Colors.dim },
  unitText: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  inactiveBadge: { alignSelf: 'flex-start', backgroundColor: Colors.dim, borderRadius: Radius.sm, paddingHorizontal: Spacing[2], paddingVertical: 2 },
  inactiveBadgeText: { fontSize: Typography.fontSize.xs, color: Colors.white },

  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border, gap: Spacing[2], ...Shadows.sm },
  cardLow: { borderColor: Colors.error, borderWidth: 1.5 },
  cardLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  stockRow: { flexDirection: 'row', alignItems: 'center' },
  priceItem: { flex: 1, alignItems: 'center', gap: 2 },
  priceVal: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  priceItemLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  priceDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  lowBanner: { backgroundColor: '#FFF5F5', borderRadius: Radius.sm, padding: Spacing[2], marginTop: Spacing[1] },
  lowBannerText: { fontSize: Typography.fontSize.xs, color: Colors.error },

  actions: { flexDirection: 'row', gap: Spacing[3] },
  actionBtn: { flex: 1, backgroundColor: Colors.brown, borderRadius: Radius.lg, padding: Spacing[4], alignItems: 'center', gap: Spacing[1] },
  actionBtnSecondary: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  actionBtnEmoji: { fontSize: 22 },
  actionBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing[5], gap: Spacing[3] },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  modalHint: { fontSize: Typography.fontSize.sm, color: Colors.muted },
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
