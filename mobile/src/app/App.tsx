/**
 * App root — placeholder until navigation and auth are wired up.
 * The launch screen uses the brand palette from the design system.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@vepari/design-system';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>Vepari AI</Text>
      <Text style={styles.tagline}>Your business, understood.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    color: Colors.gold,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 1.5,
  },
  tagline: {
    color: Colors.dim,
    fontSize: Typography.fontSize.sm,
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
