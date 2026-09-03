import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import WelcomeScreen from '@/screens/auth/WelcomeScreen';
import PhoneEntryScreen from '@/screens/auth/PhoneEntryScreen';
import OtpVerifyScreen from '@/screens/auth/OtpVerifyScreen';
import ProfileSetupScreen from '@/screens/auth/ProfileSetupScreen';
import BusinessSetupScreen from '@/screens/auth/BusinessSetupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="BusinessSetup" component={BusinessSetupScreen} />
    </Stack.Navigator>
  );
}
