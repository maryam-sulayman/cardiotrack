import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { generatePlan } from '@/utils/generatePlan';

export default function PlanScreen() {
  const { userProfile } = useLocalSearchParams();
  const profile = JSON.parse(userProfile);

  const plan = generatePlan(profile);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Personalised 7-Day Plan</Text>
      {plan.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.day}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  day: {
    fontSize: 16,
  },
});
