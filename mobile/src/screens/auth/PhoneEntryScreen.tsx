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
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'PhoneEntry'>;

export default function PhoneEntryScreen({ navigation }: Props): React.JSX.Element {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = /^[6-9]\d{9}$/.test(phone);

  async function handleContinue(): Promise<void> {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      // Attempt login first; fall back to register on the OTP screen
      navigation.navigate('OtpVerify', { phone, purpose: 'login' });
    } catch (_err) {
      setError('Something went wrong. Please try again.');
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Enter your mobile number</Text>
          <Text style={styles.subtitle}>
            We'll send a 6-digit OTP to verify your number
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={Colors.dim}
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, !isValid && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.brown} />
            ) : (
              <Text style={styles.btnText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  inner: { flex: 1, paddingHorizontal: Spacing[6] },
  back: { paddingTop: Spacing[4] },
  backText: { color: Colors.brown, fontSize: Typography.fontSize.base },
  content: { flex: 1, justifyContent: 'center', gap: Spacing[4] },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brown,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.muted,
    lineHeight: Typography.fontSize.base * 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[4],
    backgroundColor: Colors.beige,
    justifyContent: 'center',
  },
  prefixText: { color: Colors.brown, fontSize: Typography.fontSize.base },
  input: {
    flex: 1,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[4],
    fontSize: Typography.fontSize.md,
    color: Colors.brown,
    letterSpacing: 2,
  },
  error: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
  },
  btn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: Colors.gold,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
});
