/**
 * Spots — Navigation
 * Tabs: Map 📍 | Explore 🔍 | My Spots ❤️ | Account 👤
 */
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@alphinium/auth';
import { STRAPI_URL } from '../config';

import { colors, typography, spacing } from '../theme';

// Tab screens
import SpotsMapScreen    from '../screens/SpotsMapScreen';
import SpotsListScreen   from '../screens/SpotsListScreen';
import MySpotsScreen     from '../screens/MySpotsScreen';
import AccountScreen     from '../screens/AccountScreen';

// Stack-only screens
import LoginScreen       from '../screens/LoginScreen';
import SpotDetailScreen  from '../screens/SpotDetailScreen';
import PinSpotScreen     from '../screens/PinSpotScreen';

const Stack = createStackNavigator();

const TABS = [
  { id: 'Map',     emoji: '📍', label: 'Map',     Screen: SpotsMapScreen },
  { id: 'Explore', emoji: '🔍', label: 'Explore', Screen: SpotsListScreen },
  { id: 'MySpots', emoji: '❤️', label: 'My Spots', Screen: MySpotsScreen },
  { id: 'Account', emoji: '👤', label: 'Account',  Screen: AccountScreen },
];

function TabBar({ active, onSelect }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const focused = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => onSelect(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>
              {tab.emoji}
            </Text>
            <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs({ navigation }) {
  const [activeTab, setActiveTab] = useState('Map');
  const activeTabDef = TABS.find(t => t.id === activeTab) || TABS[0];
  const ActiveScreen = activeTabDef.Screen;

  return (
    <View style={styles.container}>
      <View style={styles.screenArea}>
        <ActiveScreen navigation={navigation} />
      </View>
      <TabBar active={activeTab} onSelect={setActiveTab} />
    </View>
  );
}

export default function TabNavigator() {
  const { user } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  // Show main app if logged in OR if in guest/demo mode (no backend configured)
  const showMain = !!user || guestMode;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: typography.bold, fontSize: typography.base },
        headerBackTitle: 'Back',
      }}
    >
      {showMain ? (
        <Stack.Screen name="Main"       component={MainTabs}         options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {(props) => (
            <LoginScreen
              {...props}
              onGuestAccess={!STRAPI_URL ? () => setGuestMode(true) : undefined}
            />
          )}
        </Stack.Screen>
      )}
      <Stack.Screen name="SpotDetail"   component={SpotDetailScreen} options={{ title: 'Spot Details', headerBackTitle: 'Back' }} />
      <Stack.Screen name="PinSpot"      component={PinSpotScreen}    options={{ title: '📍 Pin a Spot', headerBackTitle: 'Back' }} />
      <Stack.Screen name="SpotsList"    component={SpotsListScreen}  options={{ title: 'All Spots', headerBackTitle: 'Back' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screenArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  tabEmoji: { fontSize: 20, opacity: 0.5 },
  tabEmojiFocused: { opacity: 1 },
  tabLabel: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  tabLabelFocused: { color: colors.primary, fontWeight: typography.semibold },
});
