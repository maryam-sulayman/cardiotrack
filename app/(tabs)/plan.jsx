import GeneratingScreen from '@/components/GeneratingScreen';
import { db, firebaseAuth } from '@/config/firebaseConfig';
import { cancelNudgeForDay, scheduleWeeklyPlan } from '@/utils/planNotifications';
import { getHabitIcon, getIconGradient, splitPlanLine } from '@/utils/planText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';

// consecutive TRUEs from Day 1
const getStreak = (arr = []) => {
  let s = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) s++;
    else break;
  }
  return s;
};

export default function PlanScreen() {
  // ======== ORIGINAL LOGIC UNCHANGED ========
  const [planItems, setPlanItems] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const streak = getStreak(completion);
  
  const [confettiKey, setConfettiKey] = useState(0);
    useEffect(() => {
      if (streak === 7) setConfettiKey((k) => k + 1);
    }, [streak]);

  useFocusEffect(
    useCallback(() => {
      fetchPlan();
    }, [])
  );

  const fetchPlan = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    setLoading(true);
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const plan = data?.gptAnalysis?.weeklyPlan || [];
      const done = data?.gptAnalysis?.completion || new Array(plan.length).fill(false);
      setPlanItems(plan);
      setCompletion(done);
    }
    setLoading(false);
  };

  useEffect(() => {
    setConfettiKey(completion.filter(Boolean).length === 7);
  }, [completion]);

  const toggleCompletion = async (index) => {
    const updated = [...completion];
    updated[index] = !updated[index];
    setCompletion(updated);

     if (updated[index]) {
    try { await cancelNudgeForDay(index); } catch {}
  }
    const ref = doc(db, 'users', firebaseAuth.currentUser.uid);
    await setDoc(ref, { gptAnalysis: { completion: updated } }, { merge: true });
  };

  const regeneratePlan = async () => {
    try {
      setIsRegenerating(true);
      const user = firebaseAuth.currentUser;
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      const userProfile = data;
      const latestPlan = userProfile.gptAnalysis || {};
      const bmi = userProfile.weight / ((userProfile.height / 100) ** 2);
      const requestBody = {
        age: userProfile.age,
        gender: userProfile.gender,
        ethnicity: userProfile.ethnicity || 'unspecified',
        bmi,
        ap_hi: latestPlan.ap_hi || 120,
        ap_lo: latestPlan.ap_lo || 80,
        smoking: latestPlan.smoking || 'no',
        stress: latestPlan.stress || 'low',
        steps: latestPlan.steps || 5000,
        completion: latestPlan.completion || []
      };
      const response = await fetch('http://192.168.1.102:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const dataResponse = await response.json();
      if (dataResponse?.weekly_plan) {
        setPlanItems(dataResponse.weekly_plan);
        setCompletion(new Array(7).fill(false));
        await setDoc(ref, {
          gptAnalysis: {
            ...latestPlan,
            weeklyPlan: dataResponse.weekly_plan,
            completion: new Array(7).fill(false),
            clinicalSummary: dataResponse.clinical_summary,
            summaryBullets: dataResponse.dashboard_summary,
            generatedAt: new Date()
          }
        }, { merge: true });
      }
      try {
      await scheduleWeeklyPlan(dataResponse.weekly_plan);
    } catch (e) {
      // Non-fatal: maybe user denied notifications.
      console.warn('Failed to schedule reminders:', e?.message || e);
    }

    } catch (error) {
      console.error('Error regenerating plan:', error);
    } finally {
      setIsRegenerating(false);
    }
  };
  // ==========================================

  if (isRegenerating) {
    const firstName = firebaseAuth.currentUser?.displayName?.split(' ')[0] || 'there';
    return <GeneratingScreen name={firstName} />;
  }
  if (loading) {
    return <View style={styles.centered}><Text>Loading your plan...</Text></View>;
  }
  if (!planItems.length) {
    return <View style={styles.centered}><Text>No plan found. Log your habits to get started!</Text></View>;
  }

  const completedCount = completion.filter(Boolean).length;
  const progress = completedCount / 7;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ===== Header (UI only) ===== */}
        <View style={styles.headerCard}>
          <View style={styles.progressWrap}>
            <Progress.Circle
              progress={progress}
              size={84}
              thickness={7}
              color="#6A0DAD"
              unfilledColor="#EEE5FF"
              borderWidth={0}
            />
            <View style={styles.progressOverlay}>
              <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Your 7‑Day Heart Plan</Text>
      
                 <Text style={styles.streakPill}>🔥 {streak}-day streak</Text>
          </View>
        </View>

        {/* ===== Cards (UI only) ===== */}
       {planItems.map((item, index) => {
  const { day, theme, body } = splitPlanLine(item);

  // define first
  const isDone = !!completion[index];

  // then compute visuals
  const baseColors = getIconGradient(theme);
  const gradColors = isDone ? ['#E5E7EB', '#CBD5E1'] : baseColors; // grey when done
  const iconTint  = isDone ? '#96a6bd78' : '#fff';

  return (
    <TouchableOpacity
      key={index}
      style={[styles.card, isDone ? styles.cardDone : styles.cardPending]}
      onPress={() => toggleCompletion(index)}
      activeOpacity={0.9}
    >
      <View style={[styles.leftAccent, isDone ? styles.leftAccentDone : styles.leftAccentPending]} />

      <View style={styles.cardContent}>
        <View style={[styles.iconShadow, isDone && styles.iconShadowDone]}>
          <LinearGradient
            colors={gradColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <MaterialCommunityIcons
              name={getHabitIcon(theme)}
              size={20}
              color={iconTint}
            />
          </LinearGradient>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.topRow}>
            <Text style={[styles.dayBadge, isDone && { color: '#94A3B8' }]}>
              Day {day || index + 1}
            </Text>
          </View>

          <Text
            style={[styles.cardText, isDone && styles.cardTextDone]}
            numberOfLines={6}
          >
            {body}
          </Text>
        </View>

        {isDone ? (
          <MaterialCommunityIcons name="check-circle" size={22} color="#34D399" />
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={22} color="#6A0DAD" />
        )}
      </View>
    </TouchableOpacity>
  );
})}

        {/* ===== Button (UI only) ===== */}
        <TouchableOpacity style={styles.regenerateButton} onPress={regeneratePlan} activeOpacity={0.9}>
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.regenerateButtonText}>Generate New 7‑Day Plan</Text>
        </TouchableOpacity>

        {/* ===== Footer (unchanged) ===== */}
        <View style={styles.sectionFooter}>
          <Text style={styles.motivation}>
            💡 Keep it up! You're building a heart‑healthy routine one step at a time.
          </Text>
          {confettiKey && (
            <>
              <ConfettiCannon count={150} origin={{ x: 200, y: 0 }} fadeOut />
              <Text style={styles.congratsText}>🎉 You completed all 7 days!</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // layout
  container: { padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // header
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressWrap: { width: 84, height: 84, marginRight: 14 },
  progressOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  progressPct: { fontSize: 14, fontWeight: '800', color: '#2D0A4A' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#21123A' , marginBottom: 6},

  // card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardPending: { backgroundColor: '#F6F0FF', borderColor: '#E9D8FF' },
  cardDone: { backgroundColor: '#F8FAFC', borderColor: '#E6F6F3' },

  leftAccent: { width: 6 },
  leftAccentPending: { backgroundColor: '#C9A7FF' },
  leftAccentDone: { backgroundColor: '#34D399' },

  cardContent: { flexDirection: 'row', alignItems: 'center', flex: 1, padding: 14, gap: 16 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
    iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
    iconShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  iconShadowDone: {
  shadowColor: 'transparent',
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
  elevation: 0,
},

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  dayBadge: {
    fontSize: 12,
    color: '#6A0DAD', 
    fontWeight: '800',
  },

  cardText: { fontSize: 16, fontWeight: '700', color: '#241A33', lineHeight: 22 },
  cardTextDone: { color: '#3e4b67ad', textDecorationLine: 'line-through', opacity: 0.7 },

  // button
  regenerateButton: {
    backgroundColor: '#FF7043',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  regenerateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // footer
  sectionFooter: { marginTop: 8, alignItems: 'center', marginBottom: 24 },
  motivation: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 12 },
  congratsText: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginTop: 12 },
   headerRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
    streakPill: {
    color: '#7C2D12',
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFF3BF',   // soft gold
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
});
