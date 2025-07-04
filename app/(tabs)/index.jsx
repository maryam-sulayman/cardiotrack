// app/(tabs)/dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Button } from 'react-native';
import LogoutButton from '@/components/LogoutButton';
import { firebaseAuth, db } from '@/config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import recommendations from '@/assets/data/recommendations.json';
import { generatePlan } from '@/utils/generatePlan';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heartScore, setHeartScore] = useState(null);
  const [plan, setPlan] = useState([]);

  const fetchData = async (user) => {
    console.log('📡 Fetching dashboard data...');
    if (!user) return;

    const profileRef = doc(db, 'users', user.uid);
    const profileSnap = await getDoc(profileRef);
    const q = query(
      collection(db, 'habitLogs'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const habitSnap = await getDocs(q);

    const hasHabits = !habitSnap.empty;
    const latestHabits = hasHabits ? habitSnap.docs[0].data() : null;

    if (profileSnap.exists()) {
      const data = profileSnap.data();
      setProfile(data);

      if (hasHabits) {
        const score = latestHabits.heartScore;
        const riskLevel = latestHabits.riskLevel;

        // If a plan already exists, reuse it unless a new one is needed
        if (data.plan && data.planGeneratedAt && !data.forceRegenerate) {
          setHeartScore(score);
          setPlan(data.plan);
          return;
        }

        const demographicKey = `${data.gender}_${data.ethnicity}`;
        const behaviours = {
          sleep: latestHabits.sleep < 6 ? 'low' : 'ok',
          stress: latestHabits.stress >= 7 ? 'high' : 'ok',
          smoking: latestHabits.smoking ? 'true' : 'false',
          hydration: latestHabits.water < 2 ? 'low' : 'ok',
          steps: latestHabits.steps < 5000 ? 'low' : 'ok'
        };

        const personalisedPlan = generatePlan({
          riskLevel: riskLevel === 'Looking good 💪' ? 'Low' : riskLevel.includes('Caution') ? 'Medium' : 'High',
          behaviours,
          demographicKey,
          days: 7
        });

        console.log('✅ Setting heart score:', score);
        console.log('✅ Setting new plan:', personalisedPlan);

        setHeartScore(score);
        setPlan(personalisedPlan);

        await setDoc(profileRef, {
          ...data,
          heartScore: score,
          riskLevel,
          plan: personalisedPlan,
          planGenerated: true,
          planGeneratedAt: new Date(),
          forceRegenerate: false,
        }, { merge: true });
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        fetchData(authUser);
      }
    });
    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (authUser) => {
        if (authUser) {
          setUser(authUser);
          fetchData(authUser);
        }
      });
      return unsubscribe;
    }, [])
  );

  if (!user && !loading) {
    return (
      <View style={styles.centered}>
        <Text>You are not logged in.</Text>
        <Button title="Go to Login" onPress={() => router.replace('/welcome')} />
      </View>
    );
  }

  const hasPlan = plan.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hey, {profile?.name} 👋</Text>

      <Text style={styles.sectionTitle}>Your Heart Score:</Text>
      {heartScore !== null ? (
        <Text style={styles.subtitle}>{heartScore}/100 – {profile?.riskLevel}</Text>
      ) : (
        <>
          <Text style={styles.placeholder}>Your heart score will appear here after you log habits.</Text>
          <Button title="Log Habits Now" onPress={() => router.push('/habitlogger')} />
        </>
      )}

      <Text style={styles.sectionTitle}>Your Personalised 7-Day Plan:</Text>
      {hasPlan ? (
        <>
          {plan.map((item, index) => (
            <Text key={index} style={styles.planItem}>Day {item.day}: {item.task}</Text>
          ))}
          <Button title="View / Update Plan" onPress={() => router.push('/plan')} />
        </>
      ) : (
        <>
          <Text style={styles.placeholder}>Your plan will be generated after you log habits.</Text>
          <Button title="Log Habits Now" onPress={() => router.push('/habitlogger')} />
        </>
      )}

      <LogoutButton />
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  planItem: {
    fontSize: 15,
    marginBottom: 6,
  },
  placeholder: {
    color: '#888',
    marginBottom: 12,
  },
});
