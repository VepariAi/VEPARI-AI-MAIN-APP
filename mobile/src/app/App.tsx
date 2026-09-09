import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@vepari/design-system';
import RootNavigator from '@/navigation/RootNavigator';
import { AuthProvider } from '@/navigation/AuthContext';
import { initDb } from '@/database';
import { initSession, clearSession } from '@/services/api';
import SecurityLockScreen from '@/screens/security/SecurityLockScreen';
import { initI18n, onLanguageChange } from '@/localization';
import { isRTL } from '@vepari/types';
import type { LanguageCode } from '@vepari/types';

export default function App(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    void initI18n();
    return onLanguageChange((lang: LanguageCode) => {
      const rtl = isRTL(lang);
      if (I18nManager.isRTL !== rtl) {
        I18nManager.forceRTL(rtl);
      }
    });
  }, []);

  useEffect(() => {
    void initDb()
      .then(async () => {
        const hasToken = await initSession();
        setIsAuthenticated(hasToken);
      })
      .finally(() => setDbReady(true));
  }, []);

  const handleAuthenticated = useCallback(() => {
    setIsAuthenticated(true);
    setIsUnlocked(true); // first login: skip lock
  }, []);

  const handleSignOut = useCallback(() => {
    void clearSession().then(() => {
      setIsAuthenticated(false);
      setIsUnlocked(false);
    });
  }, []);

  if (!dbReady) return <></>;

  // Authenticated but not yet passed the security gate: show PIN/biometric lock.
  if (isAuthenticated && !isUnlocked) {
    return (
      <SafeAreaProvider>
        <SecurityLockScreen onUnlocked={() => setIsUnlocked(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brown} />
      <NavigationContainer>
        <AuthProvider onAuthenticated={handleAuthenticated} signOut={handleSignOut}>
          <RootNavigator
            isAuthenticated={isAuthenticated}
            onAuthenticated={handleAuthenticated}
          />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
