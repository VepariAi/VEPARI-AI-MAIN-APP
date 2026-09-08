import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';

interface DocumentRecord {
  id: string;
  type: string;
  title: string;
  url: string | null;
  date: string;
  createdAt: string;
}

const DOC_TYPES = [
  { id: '', label: 'All' },
  { id: 'invoice', label: 'Invoices' },
  { id: 'receipt', label: 'Receipts' },
  { id: 'purchase_order', label: 'Orders' },
  { id: 'expense_receipt', label: 'Expenses' },
  { id: 'other', label: 'Other' },
];

const TYPE_LABELS: Record<string, string> = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  purchase_order: 'Purchase Order',
  expense_receipt: 'Expense Receipt',
  other: 'Document',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

interface Props {
  businessId: string;
}

export default function DocumentsScreen({ businessId }: Props): React.JSX.Element {
  const navigation = useNavigation();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const result = await getApiClient().listDocuments(businessId, filter || undefined) as DocumentRecord[];
      setDocs(result);
    } catch {
      // keep current state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, filter]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = (doc: DocumentRecord) => {
    Alert.alert(
      'Delete Document',
      `Remove "${doc.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await getApiClient().deleteDocument(businessId, doc.id);
              setDocs(prev => prev.filter(d => d.id !== doc.id));
            } catch {
              Alert.alert('Error', 'Could not delete the document. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Documents</Text>
      </View>

      <View style={styles.filterRow}>
        {DOC_TYPES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.filterChip, filter === t.id && styles.filterChipActive]}
            onPress={() => setFilter(t.id)}
            accessibilityLabel={`Filter by ${t.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === t.id }}
          >
            <Text style={[styles.filterChipText, filter === t.id && styles.filterChipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      ) : docs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No documents yet</Text>
          <Text style={styles.emptyBody}>
            Documents created from sales, expenses, and purchases will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={d => d.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.gold} />
          }
          renderItem={({ item }) => (
            <View style={styles.docCard}>
              <View style={styles.docTypeTag}>
                <Text style={styles.docTypeText}>{TYPE_LABELS[item.type] ?? item.type}</Text>
              </View>
              <Text style={styles.docTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.docDate}>{formatDate(item.date)}</Text>
              <View style={styles.docActions}>
                {item.url ? (
                  <Text style={styles.docLinkNote}>Attachment available</Text>
                ) : (
                  <Text style={styles.docNoLink}>No attachment</Text>
                )}
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={styles.deleteBtn}
                  accessibilityLabel={`Delete ${item.title}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    backgroundColor: Colors.brown,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[5],
  },
  backBtn: { marginBottom: Spacing[2] },
  backText: { color: Colors.gold, fontSize: Typography.fontSize.sm },
  heading: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.ivory,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
    flexWrap: 'wrap',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.ivory,
  },
  filterChipActive: {
    backgroundColor: Colors.brown,
    borderColor: Colors.brown,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.muted,
  },
  filterChipTextActive: {
    color: Colors.gold,
    fontWeight: Typography.fontWeight.medium,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[8] },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: Typography.fontSize.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  list: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[10] },
  docCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  docTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.ivory,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  docTypeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.muted,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brown,
  },
  docDate: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  docActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[1],
  },
  docLinkNote: { fontSize: Typography.fontSize.xs, color: '#16a34a' },
  docNoLink: { fontSize: Typography.fontSize.xs, color: Colors.muted },
  deleteBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  deleteBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontWeight: Typography.fontWeight.medium,
  },
});
