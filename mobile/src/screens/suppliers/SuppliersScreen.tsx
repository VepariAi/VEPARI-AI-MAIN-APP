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
import PurchaseLogScreen from '@/screens/purchases/PurchaseLogScreen';

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  payableBalance: number;
  isActive: boolean;
}

function formatRupees(paise: number): string {
  const r = Math.abs(paise) / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

export default function SuppliersScreen(): React.JSX.Element {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [purchaseSupplier, setPurchaseSupplier] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const client = getApiClient();
      const businesses = await client.getMyBusinesses();
      const biz = businesses[0];
      if (!biz) return;
      setBusinessId(biz.id);
      const data = await client.listSuppliers(biz.id);
      setSuppliers(data);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async () => {
    if (!businessId || !addName.trim()) return;
    setAdding(true);
    try {
      const created = await getApiClient().createSupplier(businessId, {
        name: addName.trim(),
        ...(addPhone.trim() && { phone: addPhone.trim() }),
      });
      setSuppliers(prev => [{ ...created, email: null, isActive: true }, ...prev]);
      setShowAdd(false);
      setAddName('');
      setAddPhone('');
    } catch { /* silent */ } finally {
      setAdding(false);
    }
  };

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.phone ?? '').includes(q);
  });

  const totalPayable = suppliers.reduce((s, sup) => s + (sup.payableBalance > 0 ? sup.payableBalance : 0), 0);

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
        <Text style={styles.title}>Suppliers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          placeholderTextColor={Colors.dim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{suppliers.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: Colors.error }]}>{formatRupees(totalPayable)}</Text>
          <Text style={styles.summaryLabel}>Payable</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />}
        ListEmptyComponent={<Text style={styles.empty}>{search ? 'No results' : 'No suppliers yet. Add your first one!'}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone ?? 'No phone'}</Text>
            </View>
            <View style={styles.cardRight}>
              {item.payableBalance > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeAmount}>{formatRupees(item.payableBalance)}</Text>
                  <Text style={styles.badgeLabel}>payable</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.purchaseBtn}
                onPress={() => setPurchaseSupplier({ id: item.id, name: item.name })}
              >
                <Text style={styles.purchaseBtnText}>+ Purchase</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Purchase log modal */}
      {purchaseSupplier && businessId && (
        <Modal visible animationType="slide" onRequestClose={() => setPurchaseSupplier(null)}>
          <PurchaseLogScreen
            businessId={businessId}
            supplierId={purchaseSupplier.id}
            supplierName={purchaseSupplier.name}
            onCancel={() => setPurchaseSupplier(null)}
            onSaved={(_id, totalInPaise) => {
              setPurchaseSupplier(null);
              void load();
              Alert.alert('Purchase Recorded', `Purchase of ${formatRupees(totalInPaise)} logged.`);
            }}
          />
        </Modal>
      )}

      {/* Add supplier modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>New Supplier</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name *"
              placeholderTextColor={Colors.dim}
              value={addName}
              onChangeText={setAddName}
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone (optional)"
              placeholderTextColor={Colors.dim}
              value={addPhone}
              onChangeText={setAddPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!addName.trim() || adding) && styles.saveBtnDisabled]}
                onPress={() => void handleAdd()}
                disabled={!addName.trim() || adding}
              >
                {adding ? <ActivityIndicator color={Colors.ivory} size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
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
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[3], borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.beige, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.lg, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  info: { flex: 1, gap: 2 },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  phone: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  cardRight: { alignItems: 'flex-end', gap: Spacing[1] },
  badge: { alignItems: 'flex-end', gap: 1 },
  badgeAmount: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.error },
  badgeLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  purchaseBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
  },
  purchaseBtnText: { fontSize: Typography.fontSize.xs, color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  empty: { textAlign: 'center', color: Colors.muted, marginTop: Spacing[8], fontSize: Typography.fontSize.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing[5], gap: Spacing[4] },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  modalInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[3], fontSize: Typography.fontSize.base, color: Colors.brown },
  modalBtns: { flexDirection: 'row', gap: Spacing[3] },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center' },
  cancelBtnText: { color: Colors.muted, fontSize: Typography.fontSize.base },
  saveBtn: { flex: 1, backgroundColor: Colors.brown, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.ivory, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
});
