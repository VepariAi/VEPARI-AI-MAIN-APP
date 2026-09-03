import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface SearchHit {
  type: string;
  id: string;
  title: string;
  subtitle: string | null;
  amountInPaise?: number;
}

interface Props {
  businessId: string;
}

const TYPE_EMOJI: Record<string, string> = {
  customer: '👤',
  supplier: '🏭',
  product: '📦',
  sale: '💰',
  expense: '💸',
};

function formatRupees(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

export default function SearchScreen({ businessId }: Props): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const hits = await getApiClient().search(businessId, q.trim());
      setResults(hits);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void doSearch(text), 350);
  }, [doSearch]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search customers, products, sales…"
          placeholderTextColor={Colors.muted}
          value={query}
          onChangeText={handleChange}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {loading && <ActivityIndicator size="small" color={Colors.brown} />}
      </View>

      <FlatList
        data={results}
        keyExtractor={item => `${item.type}-${item.id}`}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searched && !loading ? (
            <Text style={styles.empty}>No results for "{query}"</Text>
          ) : !searched && query.length === 0 ? (
            <Text style={styles.hint}>Type at least 2 characters to search across customers, suppliers, products and transactions.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} activeOpacity={0.75}>
            <View style={styles.avatar}>
              <Text>{TYPE_EMOJI[item.type] ?? '📋'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.rowSub} numberOfLines={1}>{item.subtitle}</Text> : null}
            </View>
            {item.amountInPaise !== undefined && (
              <Text style={styles.amount}>{formatRupees(item.amountInPaise)}</Text>
            )}
            <Text style={styles.typeTag}>{item.type}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[2] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[2],
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[3],
    gap: Spacing[2],
  },
  icon: { fontSize: 16 },
  input: { flex: 1, paddingVertical: Spacing[3], fontSize: Typography.fontSize.base, color: Colors.brown },
  list: { paddingHorizontal: Spacing[4], gap: Spacing[2], paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: { flex: 1 },
  rowTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.brown },
  rowSub: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginTop: 2 },
  amount: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  typeTag: {
    fontSize: 10,
    color: Colors.muted,
    backgroundColor: Colors.beige,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    textTransform: 'capitalize',
  },
  empty: { textAlign: 'center', color: Colors.muted, marginTop: Spacing[8], fontSize: Typography.fontSize.sm },
  hint: { textAlign: 'center', color: Colors.muted, marginTop: Spacing[8], fontSize: Typography.fontSize.sm, paddingHorizontal: Spacing[6] },
});
