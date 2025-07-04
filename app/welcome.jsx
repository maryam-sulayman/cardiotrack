import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to CardioTrack</Text>
      <Text style={styles.subtitle}>Track habits that support your heart</Text>

      <View style={styles.buttons}>
        <Button title="Create Account" onPress={() => router.push('/auth/signup')} />
        <View style={{ height: 12 }} />
        <Button title="Log In" onPress={() => router.push('/auth/login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 40, textAlign: 'center' },
  buttons: { width: '100%' },
});
