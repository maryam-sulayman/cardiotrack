import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import HabitLogger from '../../components/HabitLogger';
import LogoutButton from '@/components/LogoutButton';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Welcome to CardioTrack</ThemedText>
        <LogoutButton />
      </View>
      
      <HabitLogger />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
});
