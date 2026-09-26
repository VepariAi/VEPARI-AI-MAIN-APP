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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
type PartyType = 'customer' | 'supplier' | 'none';

interface CustomerOption { id: string; name: string }
interface SupplierOption { id: string; name: string }

interface Props {
  businessId: string;
  preselectedCustomerId?: string;
  preselectedSupplierId?: string;
  onSaved: (paymentId: string) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank' },
  { value: 'CREDIT', label: 'Credit' },
];

export default function PaymentLogScreen({
  businessId,
  preselectedCustomerId,
  preselectedSupplierId,
  onSaved,
  onCancel,
}: Props): React.JSX.Element {
  const [partyType, setPartyType] = useState<PartyType>(
    preselectedCustomerId ? 'customer' : preselectedSupplierId ? 'supplier' : 'none',
  );
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId ?? '');
  const [selectedSupplierId, setSelectedSupplierId] = useState(preselectedSupplierId ?? '');
  const [amountText, setAmountText] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingParties, setLoadingParties] = useState(false);

  const loadParties = useCallback(async (type: PartyType) => {
    if (type === 'none') return;
    setLoadingParties(true);
    try {
      const client = getApiClient();
      if (type === 'customer') {
        const list = await client.listCustomers(businessId);
        setCustomers(list);
      } else {
        const list = await client.listSuppliers(businessId);
        setSuppliers(list);
      }
    } catch { /* silent */ } finally {
      setLoadingParties(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (partyType !== 'none') {
      void loadParties(partyType);
    }
  }, [partyType, loadParties]);

  const handleSave = async () => {
    const rupees = parseFloat(amountText.replace(/[^0-9.]/g, ''));
    if (isNaN(rupees) || rupees <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid payment amount.');
      return;
    }
    const amountInPaise = Math.round(rupees * 100);

    setSaving(true);
    try {
      type PaymentPayload = {
        amountInPaise: number;
        paymentMethod?: PaymentMethod;
        customerId?: string;
        supplierId?: string;
        description?: string;
        notes?: string;
        date?: string;
      };
      const data: PaymentPayload = { amountInPaise, paymentMethod: method };
      if (partyType === 'customer' && selectedCustomerId) data.customerId = selectedCustomerId;
      if (partyType === 'supplier' && selectedSupplierId) data.supplierId = selectedSupplierId;
      if (description.trim()) data.description = description.trim();
      if (notes.trim()) data.notes = notes.trim();

      const result = await getApiClient().recordPayment(businessId, data);
      onSaved(result.id);
    } catch {
      Alert.alert('Error', 'Could not record payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Payment</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => { void handleSave(); }} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.brown} /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Amount */}
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0.00"
                placeholderTextColor={Colors.muted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(m => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.methodChip, method === m.value && styles.methodChipActive]}
                  onPress={() => setMethod(m.value)}
                >
                  <Text style={[styles.methodChipText, method === m.value && styles.methodChipTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Party type */}
          {!preselectedCustomerId && !preselectedSupplierId ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Linked To</Text>
              <View style={styles.partyTypeRow}>
                {(['none', 'customer', 'supplier'] as PartyType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.partyChip, partyType === t && styles.partyChipActive]}
                    onPress={() => setPartyType(t)}
                  >
                    <Text style={[styles.partyChipText, partyType === t && styles.partyChipTextActive]}>
                      {t === 'none' ? 'None' : t === 'customer' ? 'Customer' : 'Supplier'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Party picker */}
          {partyType === 'customer' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Customer</Text>
              {loadingParties ? (
                <ActivityIndicator color={Colors.gold} />
              ) : (
                <View style={styles.partyList}>
                  {customers.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.partyRow, selectedCustomerId === c.id && styles.partyRowActive]}
                      onPress={() => setSelectedCustomerId(c.id)}
                    >
                      <Text style={[styles.partyRowText, selectedCustomerId === c.id && styles.partyRowTextActive]}>{c.name}</Text>
                      {selectedCustomerId === c.id ? <Text style={styles.check}>✓</Text> : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {partyType === 'supplier' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Supplier</Text>
              {loadingParties ? (
                <ActivityIndicator color={Colors.gold} />
              ) : (
                <View style={styles.partyList}>
                  {suppliers.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.partyRow, selectedSupplierId === s.id && styles.partyRowActive]}
                      onPress={() => setSelectedSupplierId(s.id)}
                    >
                      <Text style={[styles.partyRowText, selectedSupplierId === s.id && styles.partyRowTextActive]}>{s.name}</Text>
                      {selectedSupplierId === s.id ? <Text style={styles.check}>✓</Text> : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Description / Notes */}
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="What is this payment for?"
                placeholderTextColor={Colors.muted}
              />
            </View>
            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes…"
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  cancelText: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  saveText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brown, textAlign: 'right' },
  body: { padding: Spacing[4], gap: Spacing[4], paddingBottom: 40 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  field: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  fieldBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  label: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginBottom: Spacing[1], fontWeight: Typography.fontWeight.medium },
  amountInput: { fontSize: 28, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  input: { fontSize: Typography.fontSize.base, color: Colors.brown },
  textArea: { minHeight: 72 },
  section: { gap: Spacing[2] },
  sectionLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted, fontWeight: Typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  methodChip: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  methodChipActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  methodChipText: { fontSize: Typography.fontSize.sm, color: Colors.brown },
  methodChipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  partyTypeRow: { flexDirection: 'row', gap: Spacing[2] },
  partyChip: {
    flex: 1, paddingVertical: Spacing[2], borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center',
  },
  partyChipActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  partyChipText: { fontSize: Typography.fontSize.sm, color: Colors.brown },
  partyChipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  partyList: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  partyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.border,
  },
  partyRowActive: { backgroundColor: '#FFF8E7' },
  partyRowText: { fontSize: Typography.fontSize.base, color: Colors.brown },
  partyRowTextActive: { fontWeight: Typography.fontWeight.semibold },
  check: { color: Colors.gold, fontSize: 16 },
});
