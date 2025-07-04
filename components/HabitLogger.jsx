// app/(tabs)/habitlogger.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { firebaseAuth, db } from '@/config/firebaseConfig';
import { getHeartRiskScore } from '@/utils/heartRisk';

export default function HabitLogger() {
  const [water, setWater] = useState('');
  const [sleep, setSleep] = useState('');
  const [steps, setSteps] = useState('');
  const [stress, setStress] = useState('');
  const [smoking, setSmoking] = useState('');
  const [apHi, setApHi] = useState('');
  const [apLo, setApLo] = useState('');

  const router = useRouter();

  const handleSubmit = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    try {
      // Get profile info from Firestore (age, gender, ethnicity, weight, height)
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      const profileData = profileSnap.exists() ? profileSnap.data() : {};

      const habitData = {
        water: parseFloat(water),
        sleep: parseFloat(sleep),
        steps: parseInt(steps),
        stress: parseInt(stress),
        smoking: smoking.toLowerCase() === 'yes',
        ap_hi: parseInt(apHi),
        ap_lo: parseInt(apLo),
      };

      const combined = {
        ...profileData,
        ...habitData
      };

      const { score, risk } = getHeartRiskScore(combined);

      await addDoc(collection(db, 'habitLogs'), {
        ...habitData,
        uid: user.uid,
        heartScore: score,
        riskLevel: risk,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Habits logged and analysed!');
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong: ' + error.message);
    }
  };


  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log Your Daily Health</Text>

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

        <Text>Systolic BP (ap_hi)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={apHi} onChangeText={setApHi} />

        <Text>Diastolic BP (ap_lo)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={apLo} onChangeText={setApLo} />

        <Button title="Submit & Generate Plan" onPress={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
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
