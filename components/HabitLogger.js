import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { generatePlan } from '@/utils/generatePlan';

export default function HabitLogger() {
  const [water, setWater] = useState('');
  const [sleep, setSleep] = useState('');
  const [steps, setSteps] = useState('');
  const [stress, setStress] = useState('');
  const [smoking, setSmoking] = useState('');

  const [gender, setGender] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [age, setAge] = useState('');
  const [apHi, setApHi] = useState('');

  const router = useRouter();

  const handleSubmit = () => {
    const profile = {
      water: parseFloat(water),
      sleep: parseFloat(sleep),
      steps: parseInt(steps),
      stress: parseInt(stress),
      smoking: smoking.toLowerCase() === 'yes',
      gender: gender.trim(),
      ethnicity: ethnicity.trim(),
      age: parseInt(age),
      ap_hi: parseInt(apHi)
    };

    // Simulate riskLevel (temporary logic)
    let riskLevel = 'High';
    if (profile.ap_hi < 130 && profile.sleep >= 6 && profile.stress < 6) {
      riskLevel = 'Medium';
    }
    if (profile.ap_hi < 120 && profile.sleep >= 7 && profile.stress < 4) {
      riskLevel = 'Low';
    }

    const userProfile = {
      ...profile,
      riskLevel,
    };

    // Pass to plan screen
    router.push({
      pathname: '/plan',
      params: { userProfile: JSON.stringify(userProfile) },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Log Your Health Info</Text>

      <Text>Water Intake (L)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={water} onChangeText={setWater} />

      <Text>Sleep Hours</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={sleep} onChangeText={setSleep} />

      <Text>Steps</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={steps} onChangeText={setSteps} />

      <Text>Stress Level (1-10)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={stress} onChangeText={setStress} />

      <Text>Smoking (yes/no)</Text>
      <TextInput style={styles.input} value={smoking} onChangeText={setSmoking} />

      <Text>Gender</Text>
      <TextInput style={styles.input} value={gender} onChangeText={setGender} />

      <Text>Ethnicity</Text>
      <TextInput style={styles.input} value={ethnicity} onChangeText={setEthnicity} />

      <Text>Age</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} />

      <Text>Systolic Blood Pressure (ap_hi)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={apHi} onChangeText={setApHi} />

      <Button title="Submit & Generate Plan" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});
