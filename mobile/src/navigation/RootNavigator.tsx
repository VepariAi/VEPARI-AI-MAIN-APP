import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isAuthenticated: boolean;
  onAuthenticated: () => void;
}

export default function RootNavigator({ isAuthenticated, onAuthenticated }: RootNavigatorProps): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth">
          {() => <AuthNavigator onAuthenticated={onAuthenticated} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
