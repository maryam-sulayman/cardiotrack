import { firebaseAuth } from '@/config/firebaseConfig';
import { initPlanNotifications } from '@/utils/planNotifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';


export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState(null);
  const [userChecked, setUserChecked] = useState(false);

  // Listen to auth state
  useEffect(() => {
    console.log('⏳ Waiting for auth check...');
    const unsubscribe = onAuthStateChanged(firebaseAuth, user => {
      console.log('🟢 Auth state changed:', user);
      setUser(user);
      setUserChecked(true);
    });

    return unsubscribe;
  }, []);

  // Redirect logic AFTER user is checked
  useEffect(() => {
    if (!userChecked) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup && segments[0] !== 'welcome') {
      console.log('🔴 Not logged in → /welcome');
      router.replace('/welcome');
    }

    if (user && inAuthGroup) {
      console.log('🟢 Logged in → /');
      router.replace('/');
    }
  }, [userChecked, user, segments]);

   useEffect(() => {
    initPlanNotifications().catch(() => {});
  }, []);

  // Show loading screen while checking
  if (!userChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
