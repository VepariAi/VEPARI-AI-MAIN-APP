import React, { useState } from 'react';
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

interface Props {
  businessId: string;
  customerId: string;
  initialName: string;
  initialPhone?: string | null;
  initialEmail?: string | null;
  initialNotes?: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function CustomerEditScreen({
  businessId,
  customerId,
  initialName,
  initialPhone,
  initialEmail,
  initialNotes,
  onSaved,
  onCancel,
}: Props): React.JSX.Element {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Customer name is required.');
      return;
    }
    setSaving(true);
    try {
      const data: { name: string; phone?: string; email?: string; notes?: string } = { name: trimmed };
      if (phone.trim()) data.phone = phone.trim();
      if (email.trim()) data.email = email.trim();
      if (notes.trim()) data.notes = notes.trim();
      await getApiClient().updateCustomer(businessId, customerId, data);
      onSaved();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
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
          <Text style={styles.headerTitle}>Edit Customer</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => { void handleSave(); }} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.brown} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Customer name"
                placeholderTextColor={Colors.muted}
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor={Colors.muted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="customer@email.com"
                placeholderTextColor={Colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any notes about this customer…"
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  cancelText: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  saveText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brown, textAlign: 'right' },
  body: { padding: Spacing[4] },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  field: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  fieldBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  label: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginBottom: Spacing[1], fontWeight: Typography.fontWeight.medium },
  input: { fontSize: Typography.fontSize.base, color: Colors.brown },
  textArea: { minHeight: 72 },
});
