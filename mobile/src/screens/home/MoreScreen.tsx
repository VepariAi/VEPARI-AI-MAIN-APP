import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { useAuth } from '@/navigation/AuthContext';
import type { MoreStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

interface MenuItem {
  emoji: string;
  label: string;
  screen?: keyof MoreStackParamList;
}

const MENU_ITEMS: Array<{ section: string; items: MenuItem[] }> = [
  {
    section: 'Business', items: [
      { emoji: '📦', label: 'Inventory', screen: 'Inventory' },
    ],
  },
  {
    section: 'Finance', items: [
      { emoji: '📊', label: 'Reports', screen: 'Reports' },
    ],
  },
  {
    section: 'Settings', items: [
      { emoji: '🔒', label: 'Security' },
      { emoji: '❓', label: 'Help & Support' },
    ],
  },
];

export default function MoreScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {MENU_ITEMS.map(({ section, items }) => (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section}</Text>
            <View style={styles.card}>
              {items.map(({ emoji, label, screen }, i) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.row, i > 0 && styles.rowBorder]}
                  activeOpacity={0.7}
                  onPress={() => { if (screen) navigation.navigate(screen); }}
                >
                  <Text style={styles.rowEmoji}>{emoji}</Text>
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: { padding: Spacing[4], paddingBottom: Spacing[2] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  scroll: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  section: { gap: Spacing[2] },
  sectionTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], gap: Spacing[3] },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowEmoji: { fontSize: 20, width: 28 },
  rowLabel: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.brown },
  chevron: { color: Colors.muted, fontSize: Typography.fontSize.xl },
  logoutBtn: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing[4],
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  logoutText: { color: Colors.error, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium },
});
