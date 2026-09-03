import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@vepari/design-system';
import RootNavigator from '@/navigation/RootNavigator';
import { initDb } from '@/database';
import { secureRead, StorageKey } from '@/security';

export default function App(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    void initDb()
      .then(async () => {
        const token = await secureRead(StorageKey.ACCESS_TOKEN);
        setIsAuthenticated(token !== null);
      })
      .finally(() => setDbReady(true));
  }, []);

  if (!dbReady) return <></>;


  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brown} />
      <NavigationContainer>
        <RootNavigator
          isAuthenticated={isAuthenticated}
          onAuthenticated={() => setIsAuthenticated(true)}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
