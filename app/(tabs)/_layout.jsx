import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
      name="index"
      options={{
        title: 'Dashboard',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="view-dashboard" size={25} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="habitlogger"
      options={{
        title: 'Log',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="notebook-outline" size={25} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="plan"
      options={{
        title: 'Plan',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="calendar-check" size={25} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="profile"
      options={{
        title: 'Profile',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="account" size={25} color={color} />
        ),
      }}
    />

    </Tabs>
  );
}
