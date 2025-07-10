import React, { useEffect, useState, useCallback } from 'react';
import GeneratingScreen from '@/components/GeneratingScreen';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LogoutButton from '@/components/LogoutButton';
import { firebaseAuth, db } from '@/config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [heartRisk, setHeartRisk] = useState(null);
  const [heartAge, setHeartAge] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [summaryBullets, setSummaryBullets] = useState([]);
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealTips, setMealTips] = useState('');

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (authUser) => {
        if (authUser) {
          setUser(authUser);
          fetchData(authUser);
        } else {
          setUser(null);
        }
      });
      return () => unsubscribe();
    }, [])
  );

  const fetchData = async (authUser) => {
    try {
      const profileRef = doc(db, 'users', authUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) return;

      const userProfile = profileSnap.data();
      setProfile(userProfile);

      const habitsRef = collection(db, 'habitLogs');
      const q = query(habitsRef, where('uid', '==', authUser.uid), orderBy('createdAt', 'desc'), limit(1));
      const habitSnap = await getDocs(q);
      const latestHabits = !habitSnap.empty ? habitSnap.docs[0].data() : null;

      const bmi = userProfile.weight / ((userProfile.height / 100) ** 2);

      const mealCache = userProfile?.mealTips;
      if (mealCache?.plan && !userProfile?.forceMealTips) {
        console.log("✅ Cached meal tip used");
        setMealTips(mealCache.plan);
      } else {
        console.log('🍽️ Fetching meal tips...');

        const mealResponse = await fetch('http://192.168.1.107:5000/meal-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            age: userProfile.age,
            gender: userProfile.gender,
            ethnicity: userProfile.ethnicity || 'unspecified',
            bmi,
            stress: latestHabits?.stress,
            smoking: latestHabits?.smoking,
            steps: latestHabits?.steps
          })
        });

        const mealData = await mealResponse.json();
        console.log('🍽️ Meal Tips Response:', mealData);

        if (mealData?.meal_tips) {
          setMealTips(mealData.meal_tips);
          await setDoc(profileRef, {
            mealTips: {
              plan: mealData.meal_tips,
              generatedAt: new Date()
            },
            forceMealTips: false
          }, { merge: true });
        }
      }

      const cached = userProfile.gptAnalysis;
      const now = new Date();
      const forceRefresh = userProfile.forceRegenerate || false;
      const generatedAt = cached?.generatedAt?.toDate?.() || null;
      const ageInDays = generatedAt ? (now - generatedAt) / (1000 * 60 * 60 * 24) : null;
      const completion = cached?.completion || [];

      const planIsComplete = completion.length === 7 && completion.every(Boolean);
      const isStale = ageInDays === null || ageInDays > 7;
      const isValidPlan = cached && cached.heartRisk !== null && Array.isArray(cached.weeklyPlan) && cached.weeklyPlan.length > 0 && Array.isArray(cached.summaryBullets) && cached.summaryBullets.length > 0 && typeof cached.clinicalSummary === 'string' && cached.clinicalSummary.length > 0;

      if (!isValidPlan || planIsComplete || isStale || forceRefresh) {
        // Add GPT re-generation logic if needed
      } else {
        console.log('✅ Using cached GPT analysis');
        setHeartRisk(cached.heartRisk);
        setHeartAge(cached.heartAge);
        setWeeklyPlan(cached.weeklyPlan);
        setSummaryBullets(cached.summaryBullets);
        setClinicalSummary(cached.clinicalSummary);
      }
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    const firstName = profile?.name?.split(' ')[0] || 'there';
    return <GeneratingScreen name={firstName} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Hey, {profile?.name} 👋</Text>

        <Text style={styles.sectionTitle}>Your Heart Score</Text>
        {heartRisk !== null && heartAge !== null ? (
          <Text style={styles.subtitle}>🩺 Risk: {heartRisk}% • ⌐ Heart Age: {heartAge}</Text>
        ) : (
          <Text style={styles.placeholder}>Heart data will appear here.</Text>
        )}

        <Text style={styles.sectionTitle}>How You're Doing</Text>
        {summaryBullets.map((item, index) => (
          <Text key={index} style={styles.bullet}>• {item.replace(/^[-•]\s*/, '')}</Text>
        ))}

        {clinicalSummary && (
          <>
            <TouchableOpacity onPress={() => setShowFullSummary(!showFullSummary)}>
              <Text style={styles.toggle}>
                {showFullSummary ? 'Hide Full Breakdown' : 'See Full Breakdown'}
              </Text>
            </TouchableOpacity>
            {showFullSummary && (
              <Text style={styles.clinicalText}>{clinicalSummary}</Text>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Your 7-Day Heart Plan</Text>
        {Array.isArray(weeklyPlan) && weeklyPlan.length > 0 ? (
          weeklyPlan.map((item, index) => (
            <Text key={index} style={styles.planItem}>{item}</Text>
          ))
        ) : (
          <Text style={styles.placeholder}>Your plan will appear here after logging habits.</Text>
        )}

        <Text style={styles.sectionTitle}>🍽️ Today's Meal Plan</Text>
        {mealTips ? (
          <Text style={styles.mealText}>{mealTips}</Text>
        ) : (
          <Text style={styles.placeholder}>Loading meal suggestions...</Text>
        )}

        <TouchableOpacity
          style={styles.generateButton}
          onPress={async () => {
            console.log("🔁 Button clicked — generating new meal tip...");
            const ref = doc(db, 'users', firebaseAuth.currentUser.uid);
            await setDoc(ref, { forceMealTips: true }, { merge: true });
            console.log("📅 forceMealTips set to true — re-fetching data...");
            await fetchData(firebaseAuth.currentUser);
          }}
        >
          <Text style={styles.generateButtonText}>🔄 Generate New Meal Tip</Text>
        </TouchableOpacity>

        <LogoutButton />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 18, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 20 },
  planItem: { fontSize: 15, marginBottom: 6 },
  bullet: { fontSize: 15, marginBottom: 4 },
  clinicalText: { fontSize: 14, marginTop: 10, marginBottom: 16, color: '#444' },
  toggle: { color: '#007AFF', fontSize: 15, marginVertical: 10 },
  placeholder: { color: '#888', marginBottom: 12 },
  generateButton: { backgroundColor: '#FF7043', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  generateButtonText: { color: '#fff', fontWeight: 'bold' },
  mealText: { fontSize: 15, lineHeight: 22, color: '#333', marginBottom: 20 },
});
