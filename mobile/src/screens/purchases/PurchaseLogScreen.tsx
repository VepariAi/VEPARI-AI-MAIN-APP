import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';

interface Product {
  id: string;
  name: string;
  costPriceInPaise: number;
  unit: string;
}

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: string;
  unitCostInPaise: string; // displayed as rupees, converted on submit
}

const PAYMENT_METHODS: Array<{ key: PaymentMethod; label: string }> = [
  { key: 'CASH', label: 'Cash' },
  { key: 'UPI', label: 'UPI' },
  { key: 'CARD', label: 'Card' },
  { key: 'BANK_TRANSFER', label: 'Bank' },
  { key: 'CREDIT', label: 'Credit' },
];

interface Props {
  businessId: string;
  supplierId?: string;
  supplierName?: string;
  onSaved: (purchaseId: string, totalInPaise: number) => void;
  onCancel: () => void;
}

function rupeesToPaise(rupees: string): number {
  const n = parseFloat(rupees.replace(/,/g, ''));
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function PurchaseLogScreen({
  businessId,
  supplierId,
  supplierName,
  onSaved,
  onCancel,
}: Props): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    getApiClient()
      .listProducts(businessId)
      .then(data => setProducts(data))
      .catch(() => undefined)
      .finally(() => setLoadingProducts(false));
  }, [businessId]);

  const filteredProducts = products.filter(p =>
    productSearch.length === 0 || p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const addProduct = useCallback((product: Product) => {
    setItems(prev => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: '1',
        unitCostInPaise: (product.costPriceInPaise / 100).toFixed(2),
      },
    ]);
    setShowProductPicker(false);
    setProductSearch('');
  }, []);

  const updateItem = useCallback((idx: number, field: 'quantity' | 'unitCostInPaise', value: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }, []);

  const removeItem = useCallback((idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const totalInPaise = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = rupeesToPaise(item.unitCostInPaise);
    return sum + Math.round(qty * cost);
  }, 0);

  const handleSubmit = useCallback(async () => {
    if (items.length === 0) {
      Alert.alert('No items', 'Add at least one product to the purchase.');
      return;
    }
    for (const item of items) {
      const qty = parseFloat(item.quantity);
      if (!qty || qty <= 0) {
        Alert.alert('Invalid quantity', `Quantity for "${item.productName}" must be positive.`);
        return;
      }
    }
    if (totalInPaise <= 0) {
      Alert.alert('Invalid total', 'Purchase total must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const trimmedNotes = notes.trim();
      const result = await getApiClient().createPurchase(businessId, {
        ...(supplierId ? { supplierId } : {}),
        paymentMethod,
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        items: items.map(item => ({
          productId: item.productId,
          quantity: Math.round(parseFloat(item.quantity)),
          unitCostInPaise: rupeesToPaise(item.unitCostInPaise),
        })),
      });
      onSaved(result.id, result.totalInPaise);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record purchase.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [businessId, supplierId, paymentMethod, notes, items, totalInPaise, onSaved]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Log Purchase</Text>
          <View style={{ width: 60 }} />
        </View>

        {supplierName && (
          <View style={styles.supplierBadge}>
            <Text style={styles.supplierLabel}>Supplier: </Text>
            <Text style={styles.supplierName}>{supplierName}</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Items section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.card}>
              {loadingProducts ? (
                <ActivityIndicator color={Colors.gold} style={{ padding: Spacing[4] }} />
              ) : items.length === 0 ? (
                <Text style={styles.emptyItems}>No items yet. Tap "+ Add Product" below.</Text>
              ) : (
                items.map((item, idx) => (
                  <View key={idx} style={[styles.itemRow, idx > 0 && styles.itemBorder]}>
                    <View style={styles.itemTop}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                      <TouchableOpacity onPress={() => removeItem(idx)}>
                        <Text style={styles.removeText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.itemFields}>
                      <View style={styles.itemFieldWrap}>
                        <Text style={styles.fieldLabel}>Qty</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={item.quantity}
                          onChangeText={v => updateItem(idx, 'quantity', v)}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                      </View>
                      <View style={styles.itemFieldWrap}>
                        <Text style={styles.fieldLabel}>Cost/unit (₹)</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={item.unitCostInPaise}
                          onChangeText={v => updateItem(idx, 'unitCostInPaise', v)}
                          keyboardType="decimal-pad"
                          selectTextOnFocus
                        />
                      </View>
                      <View style={styles.itemFieldWrap}>
                        <Text style={styles.fieldLabel}>Subtotal</Text>
                        <Text style={styles.subtotalText}>
                          {formatRupees(Math.round((parseFloat(item.quantity) || 0) * rupeesToPaise(item.unitCostInPaise)))}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
              <TouchableOpacity
                style={styles.addItemBtn}
                onPress={() => setShowProductPicker(true)}
                disabled={loadingProducts}
              >
                <Text style={styles.addItemText}>+ Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.methodBtn, paymentMethod === key && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod(key)}
                >
                  <Text style={[styles.methodLabel, paymentMethod === key && styles.methodLabelActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Invoice number, supplier reference…"
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRupees(totalInPaise)}</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, (submitting || items.length === 0) && styles.submitBtnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={submitting || items.length === 0}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitText}>Record Purchase</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Product picker overlay */}
        {showProductPicker && (
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Product</Text>
                <TouchableOpacity onPress={() => { setShowProductPicker(false); setProductSearch(''); }}>
                  <Text style={styles.pickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.pickerSearch}
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Search products…"
                placeholderTextColor={Colors.muted}
                autoFocus
              />
              <ScrollView style={styles.pickerList}>
                {filteredProducts.length === 0 ? (
                  <Text style={styles.pickerEmpty}>No products found.</Text>
                ) : (
                  filteredProducts.map(product => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.pickerItem}
                      onPress={() => addProduct(product)}
                    >
                      <Text style={styles.pickerItemName}>{product.name}</Text>
                      <Text style={styles.pickerItemCost}>{formatRupees(product.costPriceInPaise)}/unit</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
    paddingBottom: Spacing[2],
  },
  cancelBtn: { padding: Spacing[1] },
  cancelText: { color: Colors.gold, fontSize: Typography.fontSize.base },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  supplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[2],
  },
  supplierLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  supplierName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  scroll: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  section: { gap: Spacing[2] },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  emptyItems: {
    padding: Spacing[4],
    color: Colors.muted,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  itemRow: { padding: Spacing[4], gap: Spacing[2] },
  itemBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  removeText: { color: Colors.error, fontSize: Typography.fontSize.base, paddingLeft: Spacing[2] },
  itemFields: { flexDirection: 'row', gap: Spacing[3] },
  itemFieldWrap: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  smallInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[2],
    paddingVertical: 6,
    fontSize: Typography.fontSize.sm,
    color: Colors.brown,
    backgroundColor: Colors.ivory,
  },
  subtotalText: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.semibold, paddingTop: 6 },
  addItemBtn: {
    padding: Spacing[3],
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addItemText: { color: Colors.gold, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  methodBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  methodBtnActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  methodLabel: { fontSize: Typography.fontSize.sm, color: Colors.brown },
  methodLabelActive: { color: Colors.ivory },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[3],
    fontSize: Typography.fontSize.base,
    color: Colors.brown,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
  },
  totalLabel: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  totalValue: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  submitBtn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    alignItems: 'center',
    ...Shadows.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: Colors.ivory, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  pickerClose: { color: Colors.muted, fontSize: Typography.fontSize.xl },
  pickerSearch: {
    margin: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    fontSize: Typography.fontSize.base,
    color: Colors.brown,
  },
  pickerList: { flex: 1 },
  pickerEmpty: { padding: Spacing[4], textAlign: 'center', color: Colors.muted },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemName: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.brown },
  pickerItemCost: { fontSize: Typography.fontSize.sm, color: Colors.muted },
});
