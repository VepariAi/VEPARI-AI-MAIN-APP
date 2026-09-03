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

interface Props {
  onBack: () => void;
}

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'services', label: 'Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'other', label: 'Other' },
];

export default function BusinessSettingsScreen({ onBack }: Props): React.JSX.Element {
  const [businessId, setBusinessId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessType, setBusinessType] = useState('retail');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const businesses = await getApiClient().getMyBusinesses();
      const biz = businesses[0];
      if (biz) {
        setBusinessId(biz.id);
        setName(biz.name);
        setPhone(biz.phone);
        setGstNumber(biz.gstNumber ?? '');
        setBusinessType(biz.type ?? 'retail');
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter your business name.');
      return;
    }
    if (!trimmedPhone) {
      Alert.alert('Phone required', 'Please enter a business phone number.');
      return;
    }
    setSaving(true);
    try {
      const data: { name: string; phone: string; type: string; gstNumber?: string } = {
        name: trimmedName,
        phone: trimmedPhone,
        type: businessType,
      };
      if (gstNumber.trim()) data.gstNumber = gstNumber.trim();
      await getApiClient().updateBusiness(businessId, data);
      Alert.alert('Saved', 'Business details updated.', [{ text: 'OK', onPress: onBack }]);
    } catch {
      Alert.alert('Error', 'Could not update business. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={() => { void handleSave(); }} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.brown} /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your business name"
                placeholderTextColor={Colors.muted}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91XXXXXXXXXX"
                placeholderTextColor={Colors.muted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.label}>GST Number</Text>
              <TextInput
                style={styles.input}
                value={gstNumber}
                onChangeText={setGstNumber}
                placeholder="22AAAAA0000A1Z5"
                placeholderTextColor={Colors.muted}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Business Type</Text>
            <View style={styles.typeGrid}>
              {BUSINESS_TYPES.map(bt => (
                <TouchableOpacity
                  key={bt.value}
                  style={[styles.typeChip, businessType === bt.value && styles.typeChipActive]}
                  onPress={() => setBusinessType(bt.value)}
                >
                  <Text style={[styles.typeChipText, businessType === bt.value && styles.typeChipTextActive]}>
                    {bt.label}
                  </Text>
                </TouchableOpacity>
              ))}
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
  backBtn: { minWidth: 60 },
  backText: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  headerTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  saveBtn: { minWidth: 60, alignItems: 'flex-end' },
  saveText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brown },
  body: { padding: Spacing[4], gap: Spacing[4], paddingBottom: 40 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  field: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  fieldBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  label: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginBottom: Spacing[1], fontWeight: Typography.fontWeight.medium },
  input: { fontSize: Typography.fontSize.base, color: Colors.brown },
  section: { gap: Spacing[2] },
  sectionLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted, fontWeight: Typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  typeChip: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  typeChipActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  typeChipText: { fontSize: Typography.fontSize.sm, color: Colors.brown },
  typeChipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
});
