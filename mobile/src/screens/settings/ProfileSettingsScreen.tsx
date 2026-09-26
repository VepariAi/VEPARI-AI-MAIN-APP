import React, { useState, useEffect } from 'react';
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

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ml', label: 'മലയാളം' },
];

export default function ProfileSettingsScreen({ onBack }: Props): React.JSX.Element {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getApiClient().getMe().then(user => {
      setName(user.name);
      setPhone(user.phone);
      setLanguage(user.language ?? 'en');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const data: { name: string; language?: string } = { name: trimmed };
      if (language) data.language = language;
      await getApiClient().updateMe(data);
      Alert.alert('Saved', 'Profile updated successfully.', [{ text: 'OK', onPress: onBack }]);
    } catch {
      Alert.alert('Error', 'Could not update profile. Please try again.');
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
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={() => { void handleSave(); }} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.brown} /> : <Text style={styles.saveText}>Save</Text>}
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
                placeholder="Your name"
                placeholderTextColor={Colors.muted}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.staticValue}>{phone}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Language</Text>
            <View style={styles.langGrid}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langChip, language === lang.code && styles.langChipActive]}
                  onPress={() => setLanguage(lang.code)}
                >
                  <Text style={[styles.langChipText, language === lang.code && styles.langChipTextActive]}>
                    {lang.label}
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
  staticValue: { fontSize: Typography.fontSize.base, color: Colors.muted },
  section: { gap: Spacing[2] },
  sectionLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted, fontWeight: Typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  langChip: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  langChipActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  langChipText: { fontSize: Typography.fontSize.sm, color: Colors.brown },
  langChipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
});
