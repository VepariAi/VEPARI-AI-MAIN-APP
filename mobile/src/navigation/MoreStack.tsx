import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '@vepari/design-system';
import type { MoreStackParamList } from './types';
import MoreScreen from '@/screens/home/MoreScreen';
import InventoryScreen from '@/screens/inventory/InventoryScreen';
import ProductsScreen from '@/screens/products/ProductsScreen';
import ReportsScreen from '@/screens/reports/ReportsScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import SecuritySettingsScreen from '@/screens/security/SecuritySettingsScreen';
import HelpSupportScreen from '@/screens/support/HelpSupportScreen';
import InsightsScreen from '@/screens/insights/InsightsScreen';
import VoiceScreen from '@/screens/voice/VoiceScreen';
import BriefingScreen from '@/screens/home/BriefingScreen';
import SalesScreen from '@/screens/sales/SalesScreen';
import ExpensesScreen from '@/screens/expenses/ExpensesScreen';
import PurchasesScreen from '@/screens/purchases/PurchasesScreen';
import PaymentsScreen from '@/screens/payments/PaymentsScreen';
import AlertsScreen from '@/screens/notifications/AlertsScreen';
import TeamScreen from '@/screens/team/TeamScreen';
import ProfileSettingsScreen from '@/screens/settings/ProfileSettingsScreen';
import BusinessSettingsScreen from '@/screens/settings/BusinessSettingsScreen';
import PrivacyPolicyScreen from '@/screens/legal/PrivacyPolicyScreen';
import TermsConditionsScreen from '@/screens/legal/TermsConditionsScreen';
import OperationsScreen from '@/screens/operations/OperationsScreen';
import ReturnsScreen from '@/screens/returns/ReturnsScreen';
import CookiePolicyScreen from '@/screens/legal/CookiePolicyScreen';
import RefundPolicyScreen from '@/screens/legal/RefundPolicyScreen';
import BillingScreen from '@/screens/billing/BillingScreen';
import ConnectionsScreen from '@/screens/connections/ConnectionsScreen';
import DocumentsScreen from '@/screens/documents/DocumentsScreen';
import LanguageSettingsScreen from '@/screens/settings/LanguageSettingsScreen';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

function ProductsWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <ProductsScreen businessId={bizId} />;
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

function InsightsWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <InsightsScreen businessId={bizId} />;
}

function VoiceWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <VoiceScreen businessId={bizId} />;
}

function BriefingWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <BriefingScreen businessId={bizId} />;
}

function SalesWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <SalesScreen businessId={bizId} />;
}

function ExpensesWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <ExpensesScreen businessId={bizId} />;
}

function PurchasesWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <PurchasesScreen businessId={bizId} />;
}

function PaymentsWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <PaymentsScreen businessId={bizId} />;
}

function AlertsWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <AlertsScreen businessId={bizId} />;
}

function TeamWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <TeamScreen businessId={bizId} />;
}

function ProfileWrapper(): React.JSX.Element {
  const nav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  return <ProfileSettingsScreen onBack={() => nav.goBack()} />;
}

function BusinessWrapper(): React.JSX.Element {
  const nav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  return <BusinessSettingsScreen onBack={() => nav.goBack()} />;
}

function OperationsWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <OperationsScreen businessId={bizId} />;
}

function ReturnsWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <ReturnsScreen businessId={bizId} />;
}

function DocumentsWrapper(): React.JSX.Element {
  const bizId = usePrimaryBusiness();
  if (!bizId) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.gold} /></View>;
  return <DocumentsScreen businessId={bizId} />;
}

function LanguageWrapper(): React.JSX.Element {
  const nav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  return <LanguageSettingsScreen onBack={() => nav.goBack()} />;
}

export default function MoreStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="Inventory" component={InventoryWrapper} />
      <Stack.Screen name="Products" component={ProductsWrapper} />
      <Stack.Screen name="Reports" component={ReportsWrapper} />
      <Stack.Screen name="Search" component={SearchWrapper} />
      <Stack.Screen name="Insights" component={InsightsWrapper} />
      <Stack.Screen name="VoiceAssistant" component={VoiceWrapper} />
      <Stack.Screen name="Briefing" component={BriefingWrapper} />
      <Stack.Screen name="Security" component={SecuritySettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Sales" component={SalesWrapper} />
      <Stack.Screen name="Expenses" component={ExpensesWrapper} />
      <Stack.Screen name="Purchases" component={PurchasesWrapper} />
      <Stack.Screen name="Payments" component={PaymentsWrapper} />
      <Stack.Screen name="Alerts" component={AlertsWrapper} />
      <Stack.Screen name="Team" component={TeamWrapper} />
      <Stack.Screen name="ProfileSettings" component={ProfileWrapper} />
      <Stack.Screen name="BusinessSettings" component={BusinessWrapper} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="Operations" component={OperationsWrapper} />
      <Stack.Screen name="Returns" component={ReturnsWrapper} />
      <Stack.Screen name="CookiePolicy" component={CookiePolicyScreen} />
      <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} />
      <Stack.Screen name="Billing" component={BillingScreen} />
      <Stack.Screen name="Connections" component={ConnectionsScreen} />
      <Stack.Screen name="Documents" component={DocumentsWrapper} />
      <Stack.Screen name="LanguageSettings" component={LanguageWrapper} />
    </Stack.Navigator>
  );
}
