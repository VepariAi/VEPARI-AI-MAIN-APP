import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'Welcome'>;

export default function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>Vepari AI</Text>
        <Text style={styles.tagline}>आपका AI Business Brain</Text>
        <Text style={styles.sub}>
          Voice-first business intelligence for Indian MSMEs
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('PhoneEntry')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('PhoneEntry')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brown,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[10],
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[4],
  },
  wordmark: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.gold,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: Typography.fontSize.xl,
    color: Colors.ivory,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  sub: {
    fontSize: Typography.fontSize.base,
    color: Colors.dim,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.5,
    paddingHorizontal: Spacing[4],
  },
  actions: {
    gap: Spacing[3],
  },
  primaryBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.brown,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
  secondaryBtn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.dim,
    fontSize: Typography.fontSize.sm,
  },
});
