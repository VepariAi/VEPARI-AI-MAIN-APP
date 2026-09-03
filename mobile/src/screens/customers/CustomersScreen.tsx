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

// Placeholder — replace with real API data
const CUSTOMERS = [
  { id: '1', name: 'Rajan Kumar', phone: '9876543210', creditBalance: 250000 },
  { id: '2', name: 'Priya Sharma', phone: '9123456789', creditBalance: 0 },
  { id: '3', name: 'Mohammed Ali', phone: '9988776655', creditBalance: 75000 },
  { id: '4', name: 'Lakshmi Devi', phone: '9765432100', creditBalance: 120000 },
];

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function CustomersScreen(): React.JSX.Element {
  const [search, setSearch] = useState('');

  const filtered = CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor={Colors.dim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{CUSTOMERS.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: Colors.error }]}>
            {formatRupees(CUSTOMERS.reduce((s, c) => s + c.creditBalance, 0))}
          </Text>
          <Text style={styles.summaryLabel}>Receivable</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.customerCard} activeOpacity={0.8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
            {item.creditBalance > 0 && (
              <View style={styles.creditBadge}>
                <Text style={styles.creditText}>{formatRupees(item.creditBalance)}</Text>
                <Text style={styles.creditLabel}>owes</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No customers found</Text>
        }
      />
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
  list: { paddingHorizontal: Spacing[4], gap: Spacing[2] },
  customerCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[3], borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.beige, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.lg, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  info: { flex: 1, gap: 2 },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  phone: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  creditBadge: { alignItems: 'flex-end', gap: 1 },
  creditText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.error },
  creditLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  empty: { textAlign: 'center', color: Colors.muted, marginTop: Spacing[8] },
});
