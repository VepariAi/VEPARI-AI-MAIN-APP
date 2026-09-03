import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@vepari/design-system';
import RootNavigator from '@/navigation/RootNavigator';
import { initDb } from '@/database';
import { initSession } from '@/services/api';
import SecurityLockScreen from '@/screens/security/SecurityLockScreen';

export default function App(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    void initDb()
      .then(async () => {
        const hasToken = await initSession();
        setIsAuthenticated(hasToken);
      })
      .finally(() => setDbReady(true));
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
        <RootNavigator
          isAuthenticated={isAuthenticated}
          onAuthenticated={() => {
            setIsAuthenticated(true);
            setIsUnlocked(true); // first login: already authenticated, skip lock
          }}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
