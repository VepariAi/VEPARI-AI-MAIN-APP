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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  creditBalance: number;
}

interface Props {
  businessId: string;
  onDone: () => void;
  onCancel: () => void;
}

function formatRupees(paise: number): string {
  const r = Math.abs(paise) / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

export default function CustomerCreditScreen({ businessId, onDone, onCancel }: Props): React.JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [creditType, setCreditType] = useState<'given' | 'received'>('given');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getApiClient()
      .listCustomers(businessId)
      .then(setCustomers)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [businessId]);

  const filtered = customers.filter(c =>
    search.trim().length === 0 || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = useCallback(async () => {
    if (!selected) {
      Alert.alert('Select Customer', 'Please choose a customer first.');
      return;
    }
    const rupees = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(rupees) || rupees <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid amount in rupees.');
      return;
    }
    const paise = Math.round(rupees * 100);
    const signedPaise = creditType === 'given' ? paise : -paise;
    setSaving(true);
    try {
      await getApiClient().adjustCustomerCredit(
        businessId,
        selected.id,
        signedPaise,
        description.trim() || undefined,
      );
      onDone();
    } catch {
      Alert.alert('Error', 'Failed to record credit. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [selected, amount, creditType, description, businessId, onDone]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Customer Credit</Text>
          <TouchableOpacity
            onPress={() => void handleSave()}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {selected == null ? (
          <>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search customers…"
                placeholderTextColor={Colors.muted}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>
            {loading ? (
              <ActivityIndicator style={{ marginTop: Spacing[8] }} color={Colors.gold} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={c => c.id}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: c }) => (
                  <TouchableOpacity style={styles.customerRow} onPress={() => setSelected(c)} activeOpacity={0.7}>
                    <View style={styles.customerAvatar}>
                      <Text style={styles.avatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customerName}>{c.name}</Text>
                      {c.phone ? <Text style={styles.customerPhone}>{c.phone}</Text> : null}
                    </View>
                    {c.creditBalance !== 0 && (
                      <Text style={[styles.balance, c.creditBalance > 0 ? styles.balancePositive : styles.balanceNegative]}>
                        {c.creditBalance > 0 ? '+' : '-'}{formatRupees(c.creditBalance)}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.empty}>No customers found</Text>
                }
              />
            )}
          </>
        ) : (
          <View style={styles.form}>
            <TouchableOpacity style={styles.selectedCustomer} onPress={() => setSelected(null)}>
              <Text style={styles.selectedLabel}>Customer</Text>
              <Text style={styles.selectedName}>{selected.name}</Text>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, creditType === 'given' && styles.typeBtnActive]}
                onPress={() => setCreditType('given')}
              >
                <Text style={[styles.typeBtnText, creditType === 'given' && styles.typeBtnTextActive]}>
                  Credit Given
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, creditType === 'received' && styles.typeBtnActive]}
                onPress={() => setCreditType('received')}
              >
                <Text style={[styles.typeBtnText, creditType === 'received' && styles.typeBtnTextActive]}>
                  Payment Received
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={Colors.muted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. goods sold on credit"
                placeholderTextColor={Colors.muted}
                value={description}
                onChangeText={setDescription}
              />
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
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cancelBtn: { padding: Spacing[2] },
  cancelText: { color: Colors.muted, fontSize: Typography.fontSize.base },
  title: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  saveBtn: { backgroundColor: Colors.brown, borderRadius: Radius.md, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: Colors.ivory, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.sm },
  searchBar: {
    margin: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[3],
  },
  searchInput: { paddingVertical: Spacing[3], fontSize: Typography.fontSize.base, color: Colors.brown },
  list: { paddingHorizontal: Spacing[4], gap: Spacing[2], paddingBottom: 40 },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.brown, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base },
  customerName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  customerPhone: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginTop: 2 },
  balance: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  balancePositive: { color: Colors.error },
  balanceNegative: { color: Colors.success },
  empty: { textAlign: 'center', color: Colors.muted, marginTop: Spacing[8] },
  form: { padding: Spacing[4], gap: Spacing[4] },
  selectedCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  selectedLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  selectedName: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  changeText: { color: Colors.gold, fontSize: Typography.fontSize.sm },
  typeRow: { flexDirection: 'row', gap: Spacing[3] },
  typeBtn: {
    flex: 1,
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  typeBtnActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  typeBtnText: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  typeBtnTextActive: { color: Colors.ivory, fontWeight: Typography.fontWeight.semibold },
  inputGroup: { gap: Spacing[1] },
  label: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    color: Colors.brown,
  },
});
