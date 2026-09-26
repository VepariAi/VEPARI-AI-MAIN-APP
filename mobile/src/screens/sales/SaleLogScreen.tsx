import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';

interface SaleItem {
  description: string;
  quantity: string;
  unitPriceInPaise: string; // stored as rupees string for display, converted on submit
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
  onSaved: (saleId: string, totalInPaise: number) => void;
  onCancel: () => void;
  /** Pre-filled from voice AI extraction */
  initial?: {
    description?: string;
    amountInRupees?: number;
    party?: string;
  };
}

function rupeesToPaise(rupees: string): number {
  const n = parseFloat(rupees.replace(/,/g, ''));
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function formatRupees(paise: number): string {
  const r = paise / 100;
  return `₹${r.toFixed(2)}`;
}

export default function SaleLogScreen({ businessId, onSaved, onCancel, initial }: Props): React.JSX.Element {
  const [items, setItems] = useState<SaleItem[]>([
    {
      description: initial?.description ?? '',
      quantity: '1',
      unitPriceInPaise: initial?.amountInRupees != null ? String(initial.amountInRupees) : '',
    },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState(initial?.party ? `Customer: ${initial.party}` : '');
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const totalInPaise = items.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10) || 0;
    const price = rupeesToPaise(item.unitPriceInPaise);
    return sum + qty * price;
  }, 0);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { description: '', quantity: '1', unitPriceInPaise: '' }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, field: keyof SaleItem, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }, []);

  const validateAndConfirm = useCallback(() => {
    if (items.some(i => !i.description.trim())) {
      Alert.alert('Missing info', 'Each item needs a description.');
      return;
    }
    if (totalInPaise <= 0) {
      Alert.alert('Invalid amount', 'Total must be greater than ₹0.');
      return;
    }
    setConfirmed(true);
  }, [items, totalInPaise]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const saleItems = items.map(i => ({
        description: i.description.trim(),
        quantity: parseInt(i.quantity, 10) || 1,
        unitPriceInPaise: rupeesToPaise(i.unitPriceInPaise),
      }));

      const result = await getApiClient().createSale(businessId, {
        items: saleItems,
        paymentMethod,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        totalInPaise,
      });

      onSaved(result.id, result.totalInPaise);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save sale.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }, [items, paymentMethod, notes, totalInPaise, businessId, onSaved]);

  if (confirmed) {
    // Confirm screen — shows summary before final save
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setConfirmed(false)} style={styles.backBtn}>
            <Text style={styles.backText}>← Edit</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Confirm Sale</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.confirmContent}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTotal}>{formatRupees(totalInPaise)}</Text>
            <Text style={styles.confirmLabel}>Total Sale Amount</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {items.map((item, i) => (
              <View key={i} style={styles.confirmRow}>
                <Text style={styles.confirmItem} numberOfLines={1}>
                  {item.description} × {item.quantity}
                </Text>
                <Text style={styles.confirmPrice}>
                  {formatRupees(rupeesToPaise(item.unitPriceInPaise) * (parseInt(item.quantity, 10) || 1))}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <Text style={styles.confirmDetail}>
              {PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label ?? paymentMethod}
            </Text>
          </View>

          {notes.trim() ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.confirmDetail}>{notes}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : '✓ Record Sale'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Entry screen
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Record Sale</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.itemCard}>
              <TextInput
                style={styles.input}
                placeholder="Item description"
                placeholderTextColor={Colors.muted}
                value={item.description}
                onChangeText={v => updateItem(i, 'description', v)}
              />
              <View style={styles.itemRow}>
                <TextInput
                  style={[styles.input, styles.inputSmall]}
                  placeholder="Qty"
                  placeholderTextColor={Colors.muted}
                  keyboardType="numeric"
                  value={item.quantity}
                  onChangeText={v => updateItem(i, 'quantity', v)}
                />
                <TextInput
                  style={[styles.input, styles.inputPrice]}
                  placeholder="Price (₹)"
                  placeholderTextColor={Colors.muted}
                  keyboardType="decimal-pad"
                  value={item.unitPriceInPaise}
                  onChangeText={v => updateItem(i, 'unitPriceInPaise', v)}
                />
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(i)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
            <Text style={styles.addItemText}>+ Add Item</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: Spacing[4] }]}>Payment Method</Text>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.methodBtn, paymentMethod === m.key && styles.methodBtnActive]}
                onPress={() => setPaymentMethod(m.key)}
              >
                <Text style={[styles.methodBtnText, paymentMethod === m.key && styles.methodBtnTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: Spacing[4] }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Customer name, reference, etc."
            placeholderTextColor={Colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRupees(totalInPaise)}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueBtn} onPress={validateAndConfirm}>
            <Text style={styles.continueBtnText}>Review & Confirm →</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: { padding: Spacing[2], minWidth: 60 },
  backText: { color: Colors.muted, fontSize: Typography.fontSize.base },
  title: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  form: { padding: Spacing[4], paddingBottom: 20 },
  sectionTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brown, marginBottom: Spacing[2] },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    gap: Spacing[2],
    ...Shadows.sm,
  },
  itemRow: { flexDirection: 'row', gap: Spacing[2], alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    fontSize: Typography.fontSize.base,
    color: Colors.brown,
    backgroundColor: Colors.ivory,
  },
  inputSmall: { width: 64 },
  inputPrice: { flex: 1 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  removeBtn: { padding: Spacing[2] },
  removeBtnText: { color: Colors.error, fontSize: Typography.fontSize.lg },
  addItemBtn: { alignSelf: 'flex-start', paddingVertical: Spacing[2] },
  addItemText: { color: Colors.gold, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.sm },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  methodBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  methodBtnActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  methodBtnText: { fontSize: Typography.fontSize.sm, color: Colors.brown },
  methodBtnTextActive: { color: Colors.ivory, fontWeight: Typography.fontWeight.semibold },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[5],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: { fontSize: Typography.fontSize.lg, color: Colors.brown, fontWeight: Typography.fontWeight.semibold },
  totalValue: { fontSize: Typography.fontSize.xl, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  footer: { padding: Spacing[4], borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  continueBtn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    ...Shadows.md,
  },
  continueBtnText: { color: Colors.ivory, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base },
  saveBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    ...Shadows.md,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base },
  confirmContent: { padding: Spacing[4], gap: Spacing[4] },
  confirmCard: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.xl,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[2],
    ...Shadows.md,
  },
  confirmTotal: { color: Colors.gold, fontSize: 36, fontWeight: Typography.fontWeight.bold },
  confirmLabel: { color: Colors.dim, fontSize: Typography.fontSize.sm },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[2],
    ...Shadows.sm,
  },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmItem: { flex: 1, color: Colors.brown, fontSize: Typography.fontSize.sm },
  confirmPrice: { color: Colors.brown, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.sm },
  confirmDetail: { color: Colors.brown, fontSize: Typography.fontSize.base },
});
