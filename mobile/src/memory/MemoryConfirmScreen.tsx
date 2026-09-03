import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import { saveMemory, type MemoryType } from './memoryRepository';

export interface MemoryCandidate {
  type: MemoryType;
  amountPaise?: number;
  description?: string;
  party?: string;
  itemName?: string;
  quantity?: number;
  rawTranscript: string;
  confidence: number;
}

interface Props {
  businessId: string;
  candidates: MemoryCandidate[];
  onDone: () => void;
  onCancel: () => void;
}

const TYPE_LABELS: Record<MemoryType, string> = {
  sale: 'Sale',
  expense: 'Expense',
  credit_given: 'Credit Given',
  credit_received: 'Credit Received',
  stock_update: 'Stock Update',
  customer_note: 'Customer Note',
  supplier_note: 'Supplier Note',
  unknown: 'Unknown',
};

const TYPE_COLORS: Record<MemoryType, string> = {
  sale: Colors.success,
  expense: Colors.error,
  credit_given: Colors.warning,
  credit_received: Colors.gold,
  stock_update: Colors.brown,
  customer_note: Colors.muted,
  supplier_note: Colors.muted,
  unknown: Colors.border,
};

function formatRupees(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
}

function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function MemoryConfirmScreen({ businessId, candidates, onDone, onCancel }: Props): React.JSX.Element {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(candidates.map((_, i) => i)),
  );
  const [saving, setSaving] = useState(false);

  const toggleCandidate = useCallback((index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    const toSave = candidates.filter((_, i) => selected.has(i));
    if (toSave.length === 0) {
      Alert.alert('No items selected', 'Select at least one memory to save.');
      return;
    }
    setSaving(true);
    try {
      const now = Date.now();
      for (const c of toSave) {
        const mem: import('./memoryRepository').Memory = {
          id: generateId(),
          businessId,
          type: c.type,
          rawTranscript: c.rawTranscript,
          confidence: c.confidence,
          createdAt: now,
          synced: false,
        };
        if (c.amountPaise !== undefined) mem.amountPaise = c.amountPaise;
        if (c.description !== undefined) mem.description = c.description;
        if (c.party !== undefined) mem.party = c.party;
        if (c.itemName !== undefined) mem.itemName = c.itemName;
        if (c.quantity !== undefined) mem.quantity = c.quantity;
        saveMemory(mem);
      }
      onDone();
    } catch {
      Alert.alert('Error', 'Failed to save memories. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [candidates, selected, businessId, onDone]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Discard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review & Save</Text>
        <TouchableOpacity
          onPress={() => void handleSave()}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {candidates.length} item{candidates.length !== 1 ? 's' : ''} extracted — tap to deselect
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {candidates.map((c, i) => {
          const isSelected = selected.has(i);
          return (
            <TouchableOpacity
              key={i}
              style={[styles.card, !isSelected && styles.cardDeselected]}
              onPress={() => toggleCandidate(i)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={[styles.typePill, { backgroundColor: TYPE_COLORS[c.type] + '22' }]}>
                  <Text style={[styles.typePillText, { color: TYPE_COLORS[c.type] }]}>
                    {TYPE_LABELS[c.type]}
                  </Text>
                </View>
                {c.amountPaise !== undefined && (
                  <Text style={styles.amount}>{formatRupees(c.amountPaise)}</Text>
                )}
                <View style={[styles.checkBox, isSelected && styles.checkBoxSelected]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </View>

              {c.party && (
                <Text style={styles.field}>
                  <Text style={styles.fieldLabel}>Party: </Text>{c.party}
                </Text>
              )}
              {c.itemName && (
                <Text style={styles.field}>
                  <Text style={styles.fieldLabel}>Item: </Text>
                  {c.itemName}{c.quantity ? ` × ${c.quantity}` : ''}
                </Text>
              )}
              {c.description && (
                <Text style={styles.field} numberOfLines={2}>{c.description}</Text>
              )}

              <View style={styles.confidenceRow}>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${Math.round(c.confidence * 100)}%` as `${number}%` }]} />
                </View>
                <Text style={styles.confidenceLabel}>{Math.round(c.confidence * 100)}% confident</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.muted, textAlign: 'center', paddingVertical: Spacing[3] },
  list: { padding: Spacing[4], gap: Spacing[3], paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[2],
    borderWidth: 2,
    borderColor: Colors.gold,
    ...Shadows.sm,
  },
  cardDeselected: { borderColor: Colors.border, opacity: 0.55 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  typePill: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 3 },
  typePillText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  amount: { flex: 1, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown, textAlign: 'right' },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  checkMark: { color: Colors.brown, fontSize: 13, fontWeight: Typography.fontWeight.bold },
  field: { fontSize: Typography.fontSize.sm, color: Colors.brown },
  fieldLabel: { fontWeight: Typography.fontWeight.semibold },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: Spacing[1] },
  confidenceBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border, overflow: 'hidden' },
  confidenceFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 2 },
  confidenceLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted },
});
