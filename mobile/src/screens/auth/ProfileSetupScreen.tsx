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
import { getApiClient, saveSession } from '@/services/api';

type Props = AuthScreenProps<'ProfileSetup'>;

export default function ProfileSetupScreen({ route, navigation }: Props): React.JSX.Element {
  const { phone, code } = route.params;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = name.trim().length >= 2;

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
        <View style={styles.content}>
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
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, !isValid && styles.btnDisabled]}
            onPress={() => void handleNext()}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.brown} />
            ) : (
              <Text style={styles.btnText}>Continue</Text>
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
  content: { flex: 1, justifyContent: 'center', gap: Spacing[5] },
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
