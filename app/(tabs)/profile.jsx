// app/(tabs)/profile.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator } from 'react-native';
import { firebaseAuth, db } from '@/config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import LogoutButton from '@/components/LogoutButton';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = firebaseAuth.currentUser;
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text>Profile not found. Please complete your setup.</Text>
        <Button title="Go to Profile Setup" onPress={() => router.push('/profile-setup')} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>👤 Your Profile</Text>

      <Text style={styles.label}>Name: <Text style={styles.value}>{profile.name}</Text></Text>
      <Text style={styles.label}>Age: <Text style={styles.value}>{profile.age}</Text></Text>
      <Text style={styles.label}>Gender: <Text style={styles.value}>{profile.gender}</Text></Text>
      <Text style={styles.label}>Ethnicity: <Text style={styles.value}>{profile.ethnicity}</Text></Text>
      <Text style={styles.label}>Height: <Text style={styles.value}>{profile.height} cm</Text></Text>
      <Text style={styles.label}>Weight: <Text style={styles.value}>{profile.weight} kg</Text></Text>

      {profile.heartScore !== undefined && (
        <Text style={styles.label}>Heart Score: <Text style={styles.value}>{profile.heartScore}/100</Text></Text>
      )}

      {profile.riskLevel && (
        <Text style={styles.label}>Risk Level: <Text style={styles.value}>{profile.riskLevel}</Text></Text>
      )}

      <Button title="Edit Profile" onPress={() => router.push('/profile-setup')} />
      <View style={{ marginTop: 20 }}>
        <LogoutButton />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  value: {
    fontWeight: 'normal',
  }
});