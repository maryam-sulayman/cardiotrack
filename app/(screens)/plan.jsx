import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firebaseAuth, db } from '@/config/firebaseConfig';

export default function PlanScreen() {
  const { plan } = useLocalSearchParams();
  const decodedPlan = decodeURIComponent(plan);
  const planItems = JSON.parse(decodedPlan);

  const [completion, setCompletion] = useState(new Array(planItems.length).fill(false));
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (user) {
      setUserId(user.uid);
      loadCompletion(user.uid);
    }
  }, []);

  const loadCompletion = async (uid) => {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.gptAnalysis?.completion) {
        setCompletion(data.gptAnalysis.completion);
      }
    }
  };

  const toggleCompletion = async (index) => {
    const updated = [...completion];
    updated[index] = !updated[index];
    setCompletion(updated);

    const ref = doc(db, 'users', userId);
    await setDoc(ref, {
      gptAnalysis: {
        completion: updated
      }
    }, { merge: true });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Personalised 7-Day Plan</Text>
      {planItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.card, completion[index] && styles.cardDone]}
          onPress={() => toggleCompletion(index)}
        >
          <Text style={styles.day}>{item}</Text>
          <Text style={styles.status}>{completion[index] ? '✅ Done' : '⭕ Not Yet'}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardDone: {
    backgroundColor: '#D6F5D6',
  },
  day: {
    fontSize: 16,
    marginBottom: 4,
  },
  status: {
    color: '#555',
    fontSize: 14,
  },
});
