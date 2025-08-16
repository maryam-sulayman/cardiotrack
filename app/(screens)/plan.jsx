// app/(screens)/plan.jsx  (or wherever this screen lives)
import { db, firebaseAuth } from '@/config/firebaseConfig';
import { cancelNudgeForDay } from '@/utils/planNotifications';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

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
  // --- parse plan safely from the route ---
  const { plan } = useLocalSearchParams();
  const planItems = useMemo(() => {
    try {
      const decoded = typeof plan === 'string' ? decodeURIComponent(plan) : '[]';
      const parsed = JSON.parse(decoded);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [plan]);

  const [completion, setCompletion] = useState(
    new Array(planItems.length).fill(false)
  );
  const [userId, setUserId] = useState(null);

  // Confetti: mount once when streak reaches 7
  const streak = getStreak(completion);
  const [confettiKey, setConfettiKey] = useState(0);
  useEffect(() => {
    if (streak === 7) setConfettiKey((k) => k + 1);
  }, [streak]);

  // Load saved completion for this user, normalized to plan length
  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    setUserId(user.uid);

    (async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const saved = Array.isArray(data?.gptAnalysis?.completion)
          ? data.gptAnalysis.completion
          : [];
        const normalized = new Array(planItems.length).fill(false);
        for (let i = 0; i < Math.min(saved.length, normalized.length); i++) {
          normalized[i] = !!saved[i];
        }
        setCompletion(normalized);
      }
    })();
  }, [planItems.length]);

  const toggleCompletion = async (index) => {
    const updated = [...completion];
    updated[index] = !updated[index];
    setCompletion(updated);

    // If marked complete, cancel that day's "nudge" notification
    if (updated[index]) {
      try { await cancelNudgeForDay(index); } catch {}
    }

    if (!userId) return;
    const ref = doc(db, 'users', userId);
    await setDoc(
      ref,
      { gptAnalysis: { completion: updated } },
      { merge: true }
    );
  };

  const doneCount = completion.filter(Boolean).length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header + streak */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Personalised 7-Day Plan</Text>
        <Text style={styles.streakPill}>🔥 {streak}-day streak</Text>
      </View>
      <Text style={styles.subtitle}>{doneCount} of 7 completed</Text>

      {/* Cards */}
      {planItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.card, completion[index] && styles.cardDone]}
          onPress={() => toggleCompletion(index)}
          activeOpacity={0.9}
        >
          <Text style={[styles.day, completion[index] && styles.dayDone]}>
            {item}
          </Text>
          <Text style={[styles.status, completion[index] && styles.statusDone]}>
            {completion[index] ? '✅ Done' : '⭕ Not Yet'}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Confetti fires once when streak hits 7 */}
      {confettiKey > 0 && (
        <ConfettiCannon
          key={confettiKey}
          count={160}
          origin={{ x: 200, y: 0 }}
          fadeOut
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
    backgroundColor: '#fff',
  },

  // header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F1133',
  },
  subtitle: {
    color: '#6B6B6B',
    marginBottom: 16,
    fontWeight: '600',
  },
  streakPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF3BF',   // soft gold
    borderWidth: 1,
    borderColor: '#FBBF24',
    color: '#7C2D12',
    fontWeight: '800',
    overflow: 'hidden',
  },

  // cards
  card: {
    backgroundColor: '#F6F7FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  cardDone: {
    backgroundColor: '#EAF8F3',
    borderColor: '#CFF0E4',
  },
  day: {
    fontSize: 16,
    marginBottom: 6,
    color: '#1E2733',
    fontWeight: '600',
    lineHeight: 22,
  },
  dayDone: {
    textDecorationLine: 'line-through',
    color: '#0F172A',
    opacity: 0.75,
  },
  status: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  statusDone: {
    color: '#10B981',
  },
});
