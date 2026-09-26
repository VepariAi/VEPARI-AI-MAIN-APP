import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';

interface Props {
  businessId: string;
  supplierId: string;
  supplierName: string;
  currentPayableInPaise: number;
  onDone: () => void;
  onCancel: () => void;
}

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'CASH', label: 'Cash' },
  { key: 'UPI', label: 'UPI' },
  { key: 'BANK_TRANSFER', label: 'Bank' },
  { key: 'CARD', label: 'Card' },
];

function formatRupees(paise: number): string {
  const r = Math.abs(paise) / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

export default function SupplierPaymentScreen({
  businessId,
  supplierId,
  supplierName,
  currentPayableInPaise,
  onDone,
  onCancel,
}: Props): React.JSX.Element {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const rupees = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(rupees) || rupees <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid amount in rupees.');
      return;
    }
    const paise = Math.round(rupees * 100);
    if (paise > currentPayableInPaise) {
      Alert.alert(
        'Amount Exceeds Balance',
        `You can pay at most ${formatRupees(currentPayableInPaise)} to clear this supplier's balance.`,
      );
      return;
    }
    const trimmedNote = note.trim();
    setSaving(true);
    try {
      await getApiClient().adjustSupplierPayable(
        businessId,
        supplierId,
        -paise,
        trimmedNote || undefined,
        paymentMethod,
      );
      onDone();
    } catch {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [amount, currentPayableInPaise, note, businessId, supplierId, paymentMethod, onDone]);

  const canSave = amount.trim().length > 0 && !saving;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pay Supplier</Text>
          <TouchableOpacity
            onPress={() => void handleSave()}
            disabled={!canSave}
            style={[styles.headerBtn, styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          >
            {saving
              ? <ActivityIndicator color={Colors.ivory} size="small" />
              : <Text style={styles.saveText}>Record</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Supplier card */}
          <View style={styles.supplierCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{supplierName[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={styles.supplierInfo}>
              <Text style={styles.supplierName}>{supplierName}</Text>
              <Text style={styles.supplierBalance}>
                Outstanding: <Text style={styles.balanceAmt}>{formatRupees(currentPayableInPaise)}</Text>
              </Text>
            </View>
          </View>

          {/* Amount input */}
          <View style={styles.section}>
            <Text style={styles.label}>Payment Amount (₹)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Colors.muted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />
            {currentPayableInPaise > 0 && (
              <TouchableOpacity
                style={styles.fullPayBtn}
                onPress={() => setAmount((currentPayableInPaise / 100).toFixed(0))}
              >
                <Text style={styles.fullPayText}>Pay full balance ({formatRupees(currentPayableInPaise)})</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.methodBtn, paymentMethod === m.key && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod(m.key)}
                >
                  <Text style={[styles.methodText, paymentMethod === m.key && styles.methodTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. partial payment for Oct invoice"
              placeholderTextColor={Colors.muted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>
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
    backgroundColor: Colors.white,
  },
  headerBtn: { padding: Spacing[2], minWidth: 60 },
  cancelText: { color: Colors.muted, fontSize: Typography.fontSize.base },
  title: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  saveBtn: { backgroundColor: Colors.brown, borderRadius: Radius.md, paddingHorizontal: Spacing[3], alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { color: Colors.ivory, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.sm },
  body: { padding: Spacing[4], gap: Spacing[4] },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.fontSize.xl, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  supplierInfo: { flex: 1, gap: 4 },
  supplierName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  supplierBalance: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  balanceAmt: { color: Colors.error, fontWeight: Typography.fontWeight.semibold },
  section: { gap: Spacing[2] },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  amountInput: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brown,
    textAlign: 'center',
  },
  fullPayBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    backgroundColor: Colors.beige,
  },
  fullPayText: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  methodRow: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
  methodBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  methodBtnActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  methodText: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  methodTextActive: { color: Colors.ivory, fontWeight: Typography.fontWeight.semibold },
  noteInput: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    color: Colors.brown,
    textAlignVertical: 'top',
  },
});
