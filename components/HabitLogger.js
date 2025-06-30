import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig'; // adjust path if needed
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';

export default function HabitLogger() {
  const [water, setWater] = useState('');
  const [sleep, setSleep] = useState('');
  const [steps, setSteps] = useState('');
  const [stress, setStress] = useState('');
  const [smoking, setSmoking] = useState('');

  const handleSubmit = async () => {
    try {
      const docRef = await addDoc(collection(db, 'habitLogs'), {
        water: parseFloat(water),
        sleep: parseFloat(sleep),
        steps: parseInt(steps),
        stress: parseInt(stress),
        smoking: smoking.toLowerCase() === 'yes',
        createdAt: Timestamp.now(),
      });
      Alert.alert('Success', 'Your data has been logged!');
      
      // Optional: Clear inputs
      setWater('');
      setSleep('');
      setSteps('');
      setStress('');
      setSmoking('');
    } catch (e) {
      Alert.alert('Error', 'Failed to log data.');
      console.error('Error adding document: ', e);
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Daily Habit Logger</Text>

      <Text>Water Intake (litres)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={water}
        onChangeText={setWater}
        placeholder="e.g. 2.5"
      />

      <Text>Sleep Hours</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={sleep}
        onChangeText={setSleep}
        placeholder="e.g. 7"
      />

      <Text>Step Count</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={steps}
        onChangeText={setSteps}
        placeholder="e.g. 5000"
      />

      <Text>Stress Level (1-10)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={stress}
        onChangeText={setStress}
        placeholder="e.g. 4"
      />

      <Text>Smoking (yes/no)</Text>
      <TextInput
        style={styles.input}
        value={smoking}
        onChangeText={setSmoking}
        placeholder="yes or no"
      />

      <Button title="Submit" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});
