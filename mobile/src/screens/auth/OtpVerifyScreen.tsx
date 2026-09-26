import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import type { AuthScreenProps } from '@/navigation/types';
import { useAuth } from '@/navigation/AuthContext';
import { getApiClient, saveSession } from '@/services/api';

type Props = AuthScreenProps<'OtpVerify'>;

const OTP_LENGTH = 6;

export default function OtpVerifyScreen({ route, navigation }: Props): React.JSX.Element {
  const { onAuthenticated } = useAuth();
  const { phone, purpose } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleVerify(): Promise<void> {
    if (otp.length !== OTP_LENGTH) return;
    setLoading(true);
    setError('');
    try {
      const api = getApiClient();
      if (purpose === 'login') {
        const res = await api.login(phone, otp);
        await saveSession(res.tokens.accessToken, res.tokens.refreshToken);
        onAuthenticated();
      } else {
        navigation.navigate('ProfileSetup', { phone, code: otp });
      }
    } catch (_err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    setResendTimer(30);
    setOtp('');
    setError('');
    try {
      const api = getApiClient();
      await api.sendOtp(phone, purpose === 'login' ? 'LOGIN' : 'REGISTER');
    } catch {
      setError('Failed to resend OTP. Please try again.');
    }
  }

  const digits = otp.padEnd(OTP_LENGTH, ' ').split('');

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit OTP sent to{'\n'}
          <Text style={styles.phone}>+91 {phone}</Text>
        </Text>

        <TouchableOpacity onPress={() => inputRef.current?.focus()} style={styles.digitRow}>
          {digits.map((d, i) => (
            <View
              key={i}
              style={[styles.digitBox, otp.length === i && styles.digitBoxActive]}
            >
              <Text style={styles.digitText}>{d.trim()}</Text>
            </View>
          ))}
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={v => {
            const cleaned = v.replace(/\D/g, '').slice(0, OTP_LENGTH);
            setOtp(cleaned);
            if (cleaned.length === OTP_LENGTH) void handleVerify();
          }}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          style={styles.hiddenInput}
          autoFocus
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, otp.length !== OTP_LENGTH && styles.btnDisabled]}
          onPress={() => void handleVerify()}
          disabled={otp.length !== OTP_LENGTH || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.brown} />
          ) : (
            <Text style={styles.btnText}>Verify</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend OTP in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={() => void handleResend()}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory, paddingHorizontal: Spacing[6] },
  back: { paddingTop: Spacing[4] },
  backText: { color: Colors.brown, fontSize: Typography.fontSize.base },
  content: { flex: 1, justifyContent: 'center', gap: Spacing[5] },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.muted, lineHeight: 22 },
  phone: { color: Colors.brown, fontWeight: Typography.fontWeight.semibold },
  digitRow: { flexDirection: 'row', gap: Spacing[2], justifyContent: 'center' },
  digitBox: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxActive: { borderColor: Colors.brown },
  digitText: { fontSize: Typography.fontSize.xl, color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  error: { color: Colors.error, fontSize: Typography.fontSize.sm, textAlign: 'center' },
  btn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.gold, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  resendRow: { alignItems: 'center' },
  resendTimer: { color: Colors.muted, fontSize: Typography.fontSize.sm },
  resendLink: { color: Colors.brown, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
});
