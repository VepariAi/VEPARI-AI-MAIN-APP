import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { hasPin, clearPin, setPin as savePinFn, verifyPin } from '@/security/pin';
import { getBiometricType, storeBiometricSentinel } from '@/security/biometric';
import { secureRead, secureWrite, secureDelete, StorageKey } from '@/security/secureStorage';
import SecurityLockScreen from './SecurityLockScreen';

export default function SecuritySettingsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [settingUpPin, setSettingUpPin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const [hasPinResult, bioType, bioEnabled] = await Promise.all([
      hasPin(),
      getBiometricType(),
      secureRead(StorageKey.BIOMETRIC_ENABLED).then(v => v === 'true'),
    ]);
    setPinEnabled(hasPinResult);
    setBiometricType(bioType);
    setBiometricEnabled(bioEnabled);
    setLoaded(true);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const handleTogglePin = useCallback(() => {
    if (pinEnabled) {
      Alert.alert(
        'Remove PIN',
        'This will disable PIN lock. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              void clearPin().then(() => {
                setPinEnabled(false);
                setBiometricEnabled(false);
                void secureDelete(StorageKey.BIOMETRIC_ENABLED);
              });
            },
          },
        ],
      );
    } else {
      setSettingUpPin(true);
    }
  }, [pinEnabled]);

  const handleToggleBiometric = useCallback(async (value: boolean) => {
    if (!pinEnabled) {
      Alert.alert('Set PIN First', 'Enable a PIN before turning on biometric unlock.');
      return;
    }
    if (value) {
      await storeBiometricSentinel();
      await secureWrite(StorageKey.BIOMETRIC_ENABLED, 'true');
    } else {
      await secureDelete(StorageKey.BIOMETRIC_ENABLED);
    }
    setBiometricEnabled(value);
  }, [pinEnabled]);

  if (settingUpPin) {
    return (
      <SecurityLockScreen
        onUnlocked={() => {
          setSettingUpPin(false);
          void reload();
        }}
      />
    );
  }

  if (!loaded) return <SafeAreaView style={styles.container} />;

  const bioLabel = biometricType === 'FaceID' ? 'Face ID' : biometricType === 'TouchID' ? 'Touch ID' : 'Fingerprint';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Lock</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>PIN Lock</Text>
                <Text style={styles.rowSub}>Require a 6-digit PIN to open the app</Text>
              </View>
              <Switch
                value={pinEnabled}
                onValueChange={handleTogglePin}
                trackColor={{ true: Colors.brown, false: Colors.border }}
                thumbColor={Colors.ivory}
              />
            </View>

            {pinEnabled && biometricType !== 'none' && (
              <View style={[styles.row, styles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{bioLabel}</Text>
                  <Text style={styles.rowSub}>Use {bioLabel} to unlock instead of PIN</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={value => void handleToggleBiometric(value)}
                  trackColor={{ true: Colors.brown, false: Colors.border }}
                  thumbColor={Colors.ivory}
                />
              </View>
            )}

            {pinEnabled && (
              <TouchableOpacity
                style={[styles.row, styles.rowBorder]}
                onPress={() => setSettingUpPin(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.rowLabel}>Change PIN</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                Alert.alert(
                  'Clear App Data',
                  'This will clear all locally cached data. Your cloud data will be re-synced on next open.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: () => Alert.alert('Cleared', 'Local cache cleared.'),
                    },
                  ],
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { color: Colors.error }]}>Clear Local Cache</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: Spacing[4],
    paddingBottom: Spacing[2],
  },
  backBtn: { padding: Spacing[1] },
  backText: { color: Colors.gold, fontSize: Typography.fontSize.base },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  scroll: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  section: { gap: Spacing[2] },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowLabel: { fontSize: Typography.fontSize.base, color: Colors.brown },
  rowSub: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginTop: 2 },
  chevron: { color: Colors.muted, fontSize: Typography.fontSize.xl },
});
