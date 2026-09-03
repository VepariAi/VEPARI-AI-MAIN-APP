import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@vepari/design-system';
import type { MainTabParamList } from './types';
import AIHomeScreen from '@/screens/home/AIHomeScreen';
import FinanceScreen from '@/screens/finance/FinanceScreen';
import CustomersScreen from '@/screens/customers/CustomersScreen';
import SuppliersScreen from '@/screens/suppliers/SuppliersScreen';
import MoreScreen from '@/screens/home/MoreScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }): React.JSX.Element {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text
        style={{
          fontSize: Typography.fontSize.xs,
          color: focused ? Colors.gold : Colors.muted,
          fontWeight: focused ? Typography.fontWeight.semibold : Typography.fontWeight.regular,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function MainNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      initialRouteName="AIHome"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.brown,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: Spacing[2],
          height: 60,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.medium,
        },
      }}
    >
      <Tab.Screen
        name="AIHome"
        component={AIHomeScreen}
        options={{
          tabBarLabel: 'AI Home',
          tabBarIcon: ({ focused }) => <TabIcon label="🧠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Finance"
        component={FinanceScreen}
        options={{
          tabBarLabel: 'Finance',
          tabBarIcon: ({ focused }) => <TabIcon label="₹" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          tabBarLabel: 'Customers',
          tabBarIcon: ({ focused }) => <TabIcon label="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Suppliers"
        component={SuppliersScreen}
        options={{
          tabBarLabel: 'Suppliers',
          tabBarIcon: ({ focused }) => <TabIcon label="🏭" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ focused }) => <TabIcon label="⋯" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
