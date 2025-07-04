import React from 'react';
import { Button, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '@/config/firebaseConfig';
import { useRouter } from 'expo-router';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      router.replace('/welcome');
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  return <Button title="Log Out" onPress={handleLogout} />;
}
