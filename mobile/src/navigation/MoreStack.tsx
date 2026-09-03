import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '@vepari/design-system';
import type { MoreStackParamList } from './types';
import MoreScreen from '@/screens/home/MoreScreen';
import InventoryScreen from '@/screens/inventory/InventoryScreen';
import ReportsScreen from '@/screens/reports/ReportsScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import SecuritySettingsScreen from '@/screens/security/SecuritySettingsScreen';
import HelpSupportScreen from '@/screens/support/HelpSupportScreen';
import { getApiClient } from '@/services/api';

const Stack = createNativeStackNavigator<MoreStackParamList>();

function usePrimaryBusiness(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    getApiClient()
      .getMyBusinesses()
      .then(businesses => { if (businesses[0]) setId(businesses[0].id); })
      .catch(() => undefined);
  }, []);
  return id;
}

function InventoryWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <InventoryScreen businessId={bizId} />;
}

function ReportsWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <ReportsScreen businessId={bizId} />;
}

function SearchWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <SearchScreen businessId={bizId} />;
}

export default function MoreStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="Inventory" component={InventoryWrapper} />
      <Stack.Screen name="Reports" component={ReportsWrapper} />
      <Stack.Screen name="Search" component={SearchWrapper} />
      <Stack.Screen name="Security" component={SecuritySettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
}
