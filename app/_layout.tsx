import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';

export default function RootLayout() {
  const router = useRouter();
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        // User is logged in
        router.replace('/'); // or wherever your main app screen is
      } else {
        // User is not logged in
        router.replace('../auth/Login');
      }
      setUserChecked(true);
    });

    return unsubscribe;
  }, []);

  if (!userChecked) return null; // don’t show anything until we know

  return <Stack />;
}
