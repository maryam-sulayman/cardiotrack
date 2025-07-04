import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '@/config/firebaseConfig';

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, user => {
      console.log('🟢 Auth state changed:', user);
      setUser(user);
      setUserChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!userChecked) {
    console.log('⏳ Waiting for auth check...');
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
