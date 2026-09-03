import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// ── Auth Stack ────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneEntry: undefined;
  OtpVerify: { phone: string; purpose: 'login' | 'register' };
  ProfileSetup: { phone: string; code: string };
  BusinessSetup: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// ── More Stack (nested inside the More tab) ───────────────────────────────────

export type MoreStackParamList = {
  MoreHome: undefined;
  Inventory: undefined;
  Reports: undefined;
  Search: undefined;
  Insights: undefined;
  Security: undefined;
  HelpSupport: undefined;
};

export type MoreStackScreenProps<T extends keyof MoreStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MoreStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

// ── Main Tab Navigator ────────────────────────────────────────────────────────

export type MainTabParamList = {
  AIHome: undefined;
  Finance: undefined;
  Customers: undefined;
  Suppliers: undefined;
  More: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

// ── Root Stack ────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
