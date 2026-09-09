import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { useLanguage } from '@/hooks/useLanguage';

interface Props {
  onBack: () => void;
}

export default function LanguageSettingsScreen({ onBack }: Props): React.JSX.Element {
  const { language, languages, changeLanguage, t } = useLanguage();
  const [changing, setChanging] = useState(false);

  const handleSelect = async (code: typeof language) => {
    if (code === language || changing) return;
    setChanging(true);
    try {
      await changeLanguage(code);
      onBack();
    } finally {
      setChanging(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>‹ {t('action.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.selectLanguage')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          {languages.map((lang, i) => {
            const isActive = lang.code === language;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.row, i > 0 && styles.rowBorder, isActive && styles.rowActive]}
                onPress={() => { void handleSelect(lang.code); }}
                disabled={changing}
                activeOpacity={0.7}
              >
                <View style={styles.rowContent}>
                  <Text style={[styles.langName, isActive && styles.langNameActive]}>
                    {lang.name}
                  </Text>
                  <Text style={styles.langNameEn}>{lang.nameEn}</Text>
                </View>
                {lang.rtl && (
                  <Text style={styles.rtlBadge}>RTL</Text>
                )}
                {isActive && (
                  changing
                    ? <ActivityIndicator size="small" color={Colors.gold} />
                    : <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  body: { padding: Spacing[4], paddingBottom: 40 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[4] },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowActive: { backgroundColor: Colors.ivory },
  rowContent: { flex: 1 },
  langName: { fontSize: Typography.fontSize.base, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  langNameActive: { color: Colors.brown, fontWeight: Typography.fontWeight.bold },
  langNameEn: { fontSize: Typography.fontSize.xs, color: Colors.muted, marginTop: 2 },
  rtlBadge: {
    fontSize: 10, color: Colors.muted, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: 4, paddingVertical: 1, marginRight: Spacing[2],
  },
  checkmark: { fontSize: Typography.fontSize.lg, color: Colors.gold, fontWeight: Typography.fontWeight.bold },
});
