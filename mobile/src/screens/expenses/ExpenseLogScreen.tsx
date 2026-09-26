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

type ExpenseCategory =
  | 'rent' | 'salary' | 'utilities' | 'purchase'
  | 'marketing' | 'transport' | 'maintenance' | 'other';

const CATEGORIES: Array<{ key: ExpenseCategory; label: string; emoji: string }> = [
  { key: 'purchase',     label: 'Purchase',    emoji: '📦' },
  { key: 'salary',       label: 'Salary',      emoji: '👷' },
  { key: 'rent',         label: 'Rent',        emoji: '🏠' },
  { key: 'utilities',    label: 'Utilities',   emoji: '💡' },
  { key: 'transport',    label: 'Transport',   emoji: '🚛' },
  { key: 'marketing',    label: 'Marketing',   emoji: '📢' },
  { key: 'maintenance',  label: 'Maintenance', emoji: '🔧' },
  { key: 'other',        label: 'Other',       emoji: '📝' },
];

const PAYMENT_METHODS: Array<{ key: PaymentMethod; label: string }> = [
  { key: 'CASH',          label: 'Cash'  },
  { key: 'UPI',           label: 'UPI'   },
  { key: 'CARD',          label: 'Card'  },
  { key: 'BANK_TRANSFER', label: 'Bank'  },
  { key: 'CREDIT',        label: 'Credit'},
];

interface Props {
  businessId: string;
  onSaved: (expenseId: string, amountInPaise: number) => void;
  onCancel: () => void;
  /** Pre-filled from voice AI extraction */
  initial?: {
    category?: ExpenseCategory;
    amountInRupees?: number;
    description?: string;
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

export default function ExpenseLogScreen({ businessId, onSaved, onCancel, initial }: Props): React.JSX.Element {
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? 'other');
  const [amountStr, setAmountStr] = useState<string>(
    initial?.amountInRupees != null ? String(initial.amountInRupees) : '',
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [saving, setSaving] = useState(false);

  const amountInPaise = rupeesToPaise(amountStr);
  const categoryLabel = CATEGORIES.find(c => c.key === category)?.label ?? category;
  const categoryEmoji = CATEGORIES.find(c => c.key === category)?.emoji ?? '📝';

  const handleReview = useCallback(() => {
    if (amountInPaise <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }
    setStep('confirm');
  }, [amountInPaise]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const data: {
        category: string;
        amountInPaise: number;
        paymentMethod?: PaymentMethod;
        description?: string;
        notes?: string;
      } = {
        category,
        amountInPaise,
        paymentMethod,
      };
      if (description.trim()) data.description = description.trim();
      if (notes.trim()) data.notes = notes.trim();

      const result = await getApiClient().createExpense(businessId, data);
      onSaved(result.id, result.amountInPaise);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save expense.';
      Alert.alert('Error', message);
      setSaving(false);
    }
  }, [saving, businessId, category, amountInPaise, description, notes, paymentMethod, onSaved]);

  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('form')}>
            <Text style={styles.backBtn}>← Edit</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Expense</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmEmoji}>
              <Text style={styles.emojiText}>{categoryEmoji}</Text>
            </View>
            <Text style={styles.confirmCategory}>{categoryLabel}</Text>
            <Text style={styles.confirmAmount}>{formatRupees(amountInPaise)}</Text>
            <View style={styles.divider} />
            {description.trim() ? (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Description</Text>
                <Text style={styles.confirmValue}>{description.trim()}</Text>
              </View>
            ) : null}
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Payment</Text>
              <Text style={styles.confirmValue}>
                {PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label ?? paymentMethod}
              </Text>
            </View>
            {notes.trim() ? (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Notes</Text>
                <Text style={styles.confirmValue}>{notes.trim()}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Expense'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.backBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Expense</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Category picker */}
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text style={[styles.chipLabel, category === cat.key && styles.chipLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text style={styles.sectionLabel}>Amount (₹)</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={Colors.muted}
            keyboardType="decimal-pad"
            value={amountStr}
            onChangeText={setAmountStr}
          />

          {/* Description */}
          <Text style={styles.sectionLabel}>Description (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`e.g. ${categoryLabel.toLowerCase()} payment`}
            placeholderTextColor={Colors.muted}
            value={description}
            onChangeText={setDescription}
          />

          {/* Payment method */}
          <Text style={styles.sectionLabel}>Payment Method</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.paymentChip, paymentMethod === m.key && styles.paymentChipActive]}
                onPress={() => setPaymentMethod(m.key)}
              >
                <Text style={[styles.paymentChipText, paymentMethod === m.key && styles.paymentChipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            placeholder="Additional notes…"
            placeholderTextColor={Colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity style={styles.reviewBtn} onPress={handleReview}>
            <Text style={styles.reviewBtnText}>Review →</Text>
          </TouchableOpacity>
        </ScrollView>
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
  },
  backBtn: { color: Colors.brown, fontSize: Typography.fontSize.base, padding: Spacing[2] },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  scroll: { padding: Spacing[4], paddingBottom: 40 },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
    marginBottom: Spacing[2],
    marginTop: Spacing[4],
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  categoryChipActive: {
    borderColor: Colors.terra,
    backgroundColor: Colors.terra,
  },
  chipEmoji: { fontSize: Typography.fontSize.base },
  chipLabel: { fontSize: Typography.fontSize.sm, color: Colors.brown },
  chipLabelActive: { color: Colors.ivory, fontWeight: Typography.fontWeight.semibold },
  amountInput: {
    fontSize: 36,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brown,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  textInput: {
    fontSize: Typography.fontSize.base,
    color: Colors.brown,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  paymentRow: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
  paymentChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  paymentChipActive: { borderColor: Colors.gold, backgroundColor: Colors.gold },
  paymentChipText: { fontSize: Typography.fontSize.sm, color: Colors.brown },
  paymentChipTextActive: { fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  reviewBtn: {
    marginTop: Spacing[6],
    backgroundColor: Colors.brown,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    ...Shadows.md,
  },
  reviewBtnText: { color: Colors.ivory, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  // Confirm step
  confirmCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing[6],
    alignItems: 'center',
    marginBottom: Spacing[6],
    ...Shadows.md,
  },
  confirmEmoji: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  emojiText: { fontSize: 32 },
  confirmCategory: { fontSize: Typography.fontSize.base, color: Colors.muted, marginBottom: Spacing[1] },
  confirmAmount: { fontSize: 40, fontWeight: Typography.fontWeight.bold, color: Colors.brown, marginBottom: Spacing[4] },
  divider: { width: '100%', height: 1, backgroundColor: Colors.border, marginBottom: Spacing[4] },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: Spacing[1],
  },
  confirmLabel: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  confirmValue: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium, flexShrink: 1, textAlign: 'right' },
  saveBtn: {
    backgroundColor: Colors.terra,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    marginBottom: Spacing[3],
    ...Shadows.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.ivory, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing[3] },
  cancelBtnText: { color: Colors.muted, fontSize: Typography.fontSize.base },
});
