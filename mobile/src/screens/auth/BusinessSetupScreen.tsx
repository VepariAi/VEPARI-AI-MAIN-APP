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
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import type { AuthScreenProps } from '@/navigation/types';
import { useAuth } from '@/navigation/AuthContext';
import { getApiClient } from '@/services/api';

type Props = AuthScreenProps<'BusinessSetup'>;

const BUSINESS_TYPES = [
  { key: 'retail', label: '🛒 Retail Shop' },
  { key: 'restaurant', label: '🍽️ Restaurant / Food' },
  { key: 'services', label: '🔧 Services' },
  { key: 'manufacturing', label: '🏭 Manufacturing' },
  { key: 'distribution', label: '🚚 Distribution' },
  { key: 'other', label: '📦 Other' },
] as const;

export default function BusinessSetupScreen({ navigation: _navigation }: Props): React.JSX.Element {
  const { onAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('retail');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = name.trim().length >= 2 && /^[6-9]\d{9}$/.test(phone);

  async function handleCreate(): Promise<void> {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const api = getApiClient();
      await api.createBusiness({ name: name.trim(), type, phone });
      onAuthenticated();
    } catch (_err) {
      setError('Failed to create business. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set up your business</Text>
        <Text style={styles.subtitle}>
          Tell us about your business to get started
        </Text>

        <Text style={styles.label}>Business name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sharma General Store"
          placeholderTextColor={Colors.dim}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Business type</Text>
        <View style={styles.typeGrid}>
          {BUSINESS_TYPES.map(bt => (
            <TouchableOpacity
              key={bt.key}
              style={[styles.typeChip, type === bt.key && styles.typeChipActive]}
              onPress={() => setType(bt.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeChipText, type === bt.key && styles.typeChipTextActive]}>
                {bt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Business phone number</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit mobile number"
          placeholderTextColor={Colors.dim}
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, !isValid && styles.btnDisabled]}
          onPress={() => void handleCreate()}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.brown} />
          ) : (
            <Text style={styles.btnText}>Create Business</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  content: { padding: Spacing[6], gap: Spacing[3] },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.muted, lineHeight: 22, marginBottom: Spacing[2] },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brown, marginTop: Spacing[2] },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    fontSize: Typography.fontSize.base,
    color: Colors.brown,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  typeChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  typeChipActive: { borderColor: Colors.brown, backgroundColor: Colors.beige },
  typeChipText: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  typeChipTextActive: { color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  error: { color: Colors.error, fontSize: Typography.fontSize.sm },
  btn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.gold, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
});
