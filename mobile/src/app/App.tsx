import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@vepari/design-system';
import RootNavigator from '@/navigation/RootNavigator';

export default function App(): React.JSX.Element {
  // TODO: replace with auth context / AsyncStorage token check
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
