import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';

const SUPPLIERS = [
  { id: '1', name: 'Gupta Wholesale', phone: '9876500001', payableBalance: 850000 },
  { id: '2', name: 'Agro Foods Pvt Ltd', phone: '9876500002', payableBalance: 0 },
  { id: '3', name: 'City Electronics', phone: '9876500003', payableBalance: 340000 },
];

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function SuppliersScreen(): React.JSX.Element {
  const [search, setSearch] = useState('');

  const filtered = SUPPLIERS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suppliers</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search suppliers..."
          placeholderTextColor={Colors.dim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: Colors.error }]}>
            {formatRupees(SUPPLIERS.reduce((s, sup) => s + sup.payableBalance, 0))}
          </Text>
          <Text style={styles.summaryLabel}>Total Payable</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
            {item.payableBalance > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeAmount}>{formatRupees(item.payableBalance)}</Text>
                <Text style={styles.badgeLabel}>payable</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[4] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  addBtn: { backgroundColor: Colors.brown, borderRadius: Radius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  addBtnText: { color: Colors.gold, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  searchBox: { marginHorizontal: Spacing[4], marginBottom: Spacing[2], backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], fontSize: Typography.fontSize.base, color: Colors.brown },
  summary: { paddingHorizontal: Spacing[4], marginBottom: Spacing[3] },
  summaryItem: { gap: 2 },
  summaryVal: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  summaryLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  list: { paddingHorizontal: Spacing[4], gap: Spacing[2] },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[3], borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.beige, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.lg, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  info: { flex: 1, gap: 2 },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  phone: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  badge: { alignItems: 'flex-end', gap: 1 },
  badgeAmount: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.error },
  badgeLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
});
