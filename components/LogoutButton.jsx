import { Button, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '@/config/firebaseConfig';
import { useRouter } from 'expo-router';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      Alert.alert('Logged out');
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return <Button title="Logout" onPress={handleLogout} />;
}
