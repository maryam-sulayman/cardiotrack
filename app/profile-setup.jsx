import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView, Alert, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseAuth, db } from '@/config/firebaseConfig';
import { useRouter } from 'expo-router';

export default function ProfileSetup() {
  const router = useRouter();
  const user = firebaseAuth.currentUser;
  const initialName = user?.displayName || '';
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false);
  const [ethnicity, setEthnicity] = useState('');
  const [ethnicityOptions, setEthnicityOptions] = useState([
    { label: 'Asian', value: 'Asian' },
    { label: 'Black', value: 'Black' },
    { label: 'Hispanic', value: 'Hispanic' },
    { label: 'White', value: 'White' },
    { label: 'Native American', value: 'Native American' },
    { label: 'Pacific Islander', value: 'Pacific Islander' },
    { label: 'Mixed', value: 'Mixed' },
    { label: 'Other', value: 'Other' },
  ]);
  const validate = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Required';
    if (!age || isNaN(age)) newErrors.age = 'Valid age required';
    if (!gender) newErrors.gender = 'Required';
    if (!ethnicity) newErrors.ethnicity = 'Required';
    if (!height || isNaN(height)) newErrors.height = 'Required';
    if (!weight || isNaN(weight)) newErrors.weight = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {

      await setDoc(doc(db, 'users', user.uid), {
        name,
        age: Number(age),
        gender,
        ethnicity,
        height: Number(height),
        weight: Number(weight),
        createdAt: new Date()
      });

      Alert.alert('Success', 'Profile setup complete!');
      router.replace('/(tabs)/'); // to dashboard tab
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={100}
  >
    <View style={styles.container}>
        
    <Text style={styles.title}>👋 Hey, {initialName || 'there'}! Let's set up your profile.</Text>

<TextInput placeholder="Full Name" value={name} onChangeText={setName} style={styles.input} />
{errors.name && <Text style={styles.error}>{errors.name}</Text>}

<TextInput placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" style={styles.input} />
{errors.age && <Text style={styles.error}>{errors.age}</Text>}

<TextInput placeholder="Gender" value={gender} onChangeText={setGender} style={styles.input} />
{errors.gender && <Text style={styles.error}>{errors.gender}</Text>}

<Text style={styles.label}>Ethnicity</Text>
<View style={{ zIndex: 1000, marginBottom: 10 }}>
<DropDownPicker
open={open}
value={ethnicity}
items={ethnicityOptions}
setOpen={setOpen}
setValue={setEthnicity}
setItems={setEthnicityOptions}
placeholder="Select your ethnicity"
style={{ borderColor: '#ccc' }}
dropDownContainerStyle={{ borderColor: '#ccc' }}
/>
</View>
{errors.ethnicity && <Text style={styles.error}>{errors.ethnicity}</Text>}
{errors.ethnicity && <Text style={styles.error}>{errors.ethnicity}</Text>}

<TextInput placeholder="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" style={styles.input} />

<TextInput placeholder="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" style={styles.input} />
{errors.weight && <Text style={styles.error}>{errors.weight}</Text>}

<Button title="Save Profile" onPress={handleSubmit} />
    </View>
  </KeyboardAvoidingView>
</SafeAreaView>


      
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  label: { fontSize: 14, marginBottom: 4 },
  error: { color: 'red', marginBottom: 10 },
});
