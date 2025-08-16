import { db, firebaseAuth } from "@/config/firebaseConfig";
import { cancelNudgeForDay, scheduleWeeklyPlan } from '@/utils/planNotifications';
import { titleCaseName } from '@/utils/text';
import { useFocusEffect } from "@react-navigation/native";
import { format } from 'date-fns';
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, where } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";



// Components
import GeneratingScreen from "@/components/GeneratingScreen";
import Header from "@/components/Header";
import HeartScoreCard from "@/components/HeartScoreCard";
import MealPlan from "@/components/MealPlan";
import PlanList from "@/components/PlanList";
import { SummarySection } from "@/components/SummarySection";


export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [heartRisk, setHeartRisk] = useState(null);
  const [heartAge, setHeartAge] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [summaryBullets, setSummaryBullets] = useState([]);
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [mealTips, setMealTips] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [completion, setCompletion] = useState(new Array(7).fill(false));

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
      const profileRef = doc(db, "users", authUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) return;

      const userProfile = profileSnap.data();
      setProfile(userProfile);

      const habitsRef = collection(db, "habitLogs");
      const q = query(
        habitsRef,
        where("uid", "==", authUser.uid),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const habitSnap = await getDocs(q);
      const latestHabits = !habitSnap.empty ? habitSnap.docs[0].data() : null;

      // ✅ Meal Plan
      const bmi = userProfile.weight / (userProfile.height / 100) ** 2;
      const mealCache = userProfile?.mealTips;
      if (mealCache?.plan && !userProfile.forceMealTips) {
        setMealTips(mealCache.plan);
      } else {
        const mealResponse = await fetch("http://192.168.1.102:8000/meal-tips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            age: userProfile.age,
            gender: userProfile.gender,
            ethnicity: userProfile.ethnicity || "unspecified",
            bmi,
            stress: latestHabits?.stress,
            smoking: latestHabits?.smoking,
            steps: latestHabits?.steps,
          }),
        });
        const mealData = await mealResponse.json();
        if (mealData?.meal_tips) {
          setMealTips(mealData.meal_tips);
          await setDoc(profileRef, {
            mealTips: {
              plan: mealData.meal_tips,
              generatedAt: new Date(),
            },
            forceMealTips: false,
          }, { merge: true });
        }
      }

      // ✅ Weekly Plan / GPT Analysis
      const cached = userProfile.gptAnalysis;
      const now = new Date();
      const forceRefresh = userProfile.forceRegenerate || false;
      const generatedAt = cached?.generatedAt?.toDate?.() || null;
      const ageInDays = generatedAt ? (now - generatedAt) / (1000 * 60 * 60 * 24) : null;
      const completionArray = Array.isArray(cached?.completion) ? cached.completion : new Array(7).fill(false);
      setCompletion(completionArray);

      const planIsComplete = completionArray.length === 7 && completionArray.every(Boolean);
      const isStale = ageInDays === null || ageInDays > 7;
      const isValidPlan = cached && cached.heartRisk !== null &&
        Array.isArray(cached.weeklyPlan) && cached.weeklyPlan.length > 0 &&
        Array.isArray(cached.summaryBullets) && cached.summaryBullets.length > 0 &&
        typeof cached.clinicalSummary === "string";

      const shouldRefresh = !isValidPlan || planIsComplete || isStale || forceRefresh;

      if (!shouldRefresh) {
        setHeartRisk(cached.heartRisk);
        setHeartAge(cached.heartAge);
        setWeeklyPlan(cached.weeklyPlan);
        setSummaryBullets(cached.summaryBullets);
        setClinicalSummary(cached.clinicalSummary);
        return;
      }

      if (!latestHabits) return;

      setIsGenerating(true);
      const response = await fetch("http://192.168.1.102:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: userProfile.age,
          gender: userProfile.gender,
          ethnicity: userProfile.ethnicity || "unspecified",
          bmi,
          ap_hi: latestHabits.ap_hi,
          ap_lo: latestHabits.ap_lo,
          smoking: latestHabits.smoking,
          stress: latestHabits.stress,
          steps: latestHabits.steps,
          completion,
        }),
      });

      const data = await response.json();
      const newPlan = {
        heartRisk: data.heart_risk_percent ?? null,
        heartAge: data.estimated_heart_age ?? null,
        summaryBullets: data.dashboard_summary ?? [],
        weeklyPlan: data.weekly_plan ?? [],
        clinicalSummary: data.clinical_summary ?? "",
        completion: new Array(7).fill(false),
        generatedAt: new Date(),
      };

      setHeartRisk(newPlan.heartRisk);
      setHeartAge(newPlan.heartAge);
      setWeeklyPlan(newPlan.weeklyPlan);
      setSummaryBullets(newPlan.summaryBullets);
      setClinicalSummary(newPlan.clinicalSummary);

      await setDoc(profileRef, {
        gptAnalysis: newPlan,
        forceRegenerate: false,
      }, { merge: true });

      // schedule reminders for the new plan
try {
  await scheduleWeeklyPlan(data.weekly_plan);
} catch (e) {
  console.warn('Failed to schedule reminders:', e?.message || e);
}

    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCompletion = async (index) => {
    const updated = [...completion];
    updated[index] = !updated[index];
    setCompletion(updated);

if (updated[index]) {
    try { await cancelNudgeForDay(index); } catch {}
  }
    const ref = doc(db, 'users', firebaseAuth.currentUser.uid);
    await setDoc(ref, {
      gptAnalysis: { completion: updated }
    }, { merge: true });
  };

  const getStreakCount = () => {
    let count = 0;
    for (let i = 0; i < completion.length; i++) {
      if (completion[i]) count++;
      else break;
    }
    return count;
  };

  if (isGenerating) {
    <Text style={styles.name}>{titleCaseName(profile?.name || '')}</Text>
const firstName = (titleCaseName(profile?.name || '').split(' ')[0]) || 'There';
    return <GeneratingScreen name={firstName} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor:"#fff" }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 70 }}  >
        <Header name={titleCaseName(profile?.name)} date={format(new Date(), 'EEE, MMM dd yyyy')} weeklyPlan={weeklyPlan}
        photoURL={profile?.imageURL || firebaseAuth.currentUser?.photoURL} />
        <HeartScoreCard heartRisk={heartRisk} heartAge={heartAge} />
        <SummarySection
          summaryBullets={summaryBullets}
          clinicalSummary={clinicalSummary}
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
        />
        <PlanList
          weeklyPlan={weeklyPlan}
          completion={completion}
          toggleCompletion={toggleCompletion}
          streakCount={getStreakCount()}
        />
        <MealPlan
          mealTips={mealTips}
          onGenerateNew={async () => {
            const ref = doc(db, "users", firebaseAuth.currentUser.uid);
            await setDoc(ref, { forceMealTips: true }, { merge: true });
            await fetchData(firebaseAuth.currentUser);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {backgroundColor: '#fff',
    padding: 20,
  }
});
