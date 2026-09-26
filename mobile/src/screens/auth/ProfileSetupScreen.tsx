import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import type { AuthScreenProps } from '@/navigation/types';
import { getApiClient, saveSession } from '@/services/api';

type Props = AuthScreenProps<'ProfileSetup'>;

export default function ProfileSetupScreen({ route, navigation }: Props): React.JSX.Element {
  const { phone, code } = route.params;
  const [name, setName] = useState('');
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = name.trim().length >= 2 && consented;

  async function handleNext(): Promise<void> {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const api = getApiClient();
      const res = await api.register(phone, code, name.trim());
      await saveSession(res.tokens.accessToken, res.tokens.refreshToken);
      navigation.navigate('BusinessSetup');
    } catch (_err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>
            This is how your business team will see you
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor={Colors.dim}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
            accessibilityLabel="Full name"
            accessibilityHint="Enter your full name to set up your profile"
          />

          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setConsented(v => !v)}
            activeOpacity={0.8}
            accessibilityLabel={consented ? 'Data processing consent given' : 'Give data processing consent'}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consented }}
          >
            <View style={[styles.checkbox, consented && styles.checkboxChecked]}>
              {consented ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.consentText}>
              I agree to Vepari's{' '}
              <Text style={styles.consentLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.consentLink}>Privacy Policy</Text>
              , and consent to the processing of my personal data to operate this account.
            </Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, !isValid && styles.btnDisabled]}
            onPress={() => void handleNext()}
            disabled={!isValid || loading}
            activeOpacity={0.85}
            accessibilityLabel="Continue to business setup"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid || loading }}
          >
            {loading ? (
              <ActivityIndicator color={Colors.brown} />
            ) : (
              <Text style={styles.btnText}>Continue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  inner: { flex: 1, paddingHorizontal: Spacing[6] },
  content: { flexGrow: 1, justifyContent: 'center', gap: Spacing[5], paddingVertical: Spacing[8] },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.muted, lineHeight: 22 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    fontSize: Typography.fontSize.md,
    color: Colors.brown,
  },
  error: { color: Colors.error, fontSize: Typography.fontSize.sm },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.brown,
    borderColor: Colors.brown,
  },
  checkmark: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
  },
  consentText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.muted,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  consentLink: {
    color: Colors.brown,
    fontWeight: Typography.fontWeight.medium,
  },
  btn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.gold, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
});
