import { db, firebaseAuth } from '@/config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    setFieldError('');

    if (!name || !email || !password) {
      setFieldError('All fields are required');
      return;
    }

    if (!agree) {
      setFieldError('You must agree to the terms and privacy policy');
      return;
    }

    if (password.length < 6) {
      setFieldError('Password must be at least 6 characters');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        createdAt: new Date(),
      });

      router.replace('/profile-setup');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message || 'An unexpected error occurred.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Sign Up</Text>

        {/* Name Input */}
        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#999" style={styles.icon} />
          <TextInput
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputBox}>
          <Ionicons name="mail-outline" size={20} color="#999" style={styles.icon} />
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.icon} />
          <TextInput
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        {/* Checkbox + Links */}
        <TouchableOpacity onPress={() => setAgree(!agree)} style={styles.checkboxRow}>
          <Ionicons
            name={agree ? 'checkbox' : 'square-outline'}
            size={20}
            color={agree ? '#6A0DAD' : '#ccc'}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.termsText}>
            I agree to the healthcare{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* Error */}
        {fieldError !== '' && <Text style={styles.errorText}>{fieldError}</Text>}

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up →</Text>
        </TouchableOpacity>

        {/* Link to Sign In */}
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/auth/login')}>
            Sign In
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, height: 58 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  link: {
    color: '#6A0DAD',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#A020F0',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
  },
});
