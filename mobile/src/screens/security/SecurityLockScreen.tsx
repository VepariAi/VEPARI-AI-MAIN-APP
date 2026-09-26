import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Vibration,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { verifyPin, hasPin, setPin } from '@/security/pin';
import { getBiometricType, authenticateWithBiometric } from '@/security/biometric';

const PIN_LENGTH = 6;

type Mode = 'lock' | 'setup' | 'confirm';

interface Props {
  onUnlocked: () => void;
}

export default function SecurityLockScreen({ onUnlocked }: Props): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('lock');
  const [pin, setPin_] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [error, setError] = useState('');
  const [biometricType, setBiometricType] = useState<string>('none');

  useEffect(() => {
    void (async () => {
      const type = await getBiometricType();
      setBiometricType(type);
      const pinExists = await hasPin();
      if (!pinExists) {
        setMode('setup');
        return;
      }
      // Attempt biometric first if available
      if (type !== 'none') {
        const ok = await authenticateWithBiometric('Unlock Vepari AI');
        if (ok) { onUnlocked(); return; }
      }
    })();
  }, [onUnlocked]);

  function pressDigit(d: string): void {
    setError('');
    const next = (pin + d).slice(0, PIN_LENGTH);
    setPin_(next);
    if (next.length === PIN_LENGTH) {
      void handleComplete(next);
    }
  }

  function pressDelete(): void {
    setPin_(p => p.slice(0, -1));
    setError('');
  }

  async function handleComplete(entered: string): Promise<void> {
    if (mode === 'setup') {
      setSetupPin(entered);
      setPin_('');
      setMode('confirm');
      return;
    }
    if (mode === 'confirm') {
      if (entered !== setupPin) {
        setError('PINs do not match. Try again.');
        Vibration.vibrate(400);
        setPin_('');
        setMode('setup');
        setSetupPin('');
        return;
      }
      await setPin(entered);
      onUnlocked();
      return;
    }
    // mode === 'lock'
    const ok = await verifyPin(entered);
    if (ok) {
      onUnlocked();
    } else {
      setError('Incorrect PIN. Try again.');
      Vibration.vibrate(400);
      setPin_('');
    }
  }

  async function handleBiometric(): Promise<void> {
    const ok = await authenticateWithBiometric('Unlock Vepari AI');
    if (ok) onUnlocked();
    else setError('Biometric authentication failed.');
  }

  const title =
    mode === 'setup'
      ? 'Create a 6-digit PIN'
      : mode === 'confirm'
      ? 'Confirm your PIN'
      : 'Enter PIN to continue';

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.brand}>Vepari AI</Text>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.dotRow}>
          {dots.map((filled, i) => (
            <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.keypad}>
          {['1','2','3','4','5','6','7','8','9','',  '0','⌫'].map((key, idx) => {
            if (key === '') return <View key={idx} style={styles.keyEmpty} />;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.key}
                onPress={() => key === '⌫' ? pressDelete() : pressDigit(key)}
                activeOpacity={0.7}
              >
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {mode === 'lock' && biometricType !== 'none' && (
          <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometric}>
            <Text style={styles.biometricText}>
              {biometricType === 'FaceID' ? 'Use Face ID' : 'Use Fingerprint'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[6] },
  brand: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brown,
    marginBottom: Spacing[8],
    textAlign: 'center',
  },
  dotRow: { flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[4] },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.brown,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: Colors.brown },
  error: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    gap: Spacing[3],
    marginTop: Spacing[6],
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  keyEmpty: { width: 80, height: 80 },
  keyText: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.brown,
    fontWeight: Typography.fontWeight.medium,
  },
  biometricBtn: { marginTop: Spacing[8] },
  biometricText: {
    color: Colors.brown,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
});
