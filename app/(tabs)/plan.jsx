import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Progress from 'react-native-progress';
import { firebaseAuth, db } from '@/config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter } from 'expo-router';

export default function PlanScreen() {
  const [planItems, setPlanItems] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user) return;

    const fetchPlan = async () => {
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

    fetchPlan();
  }, []);

  useEffect(() => {
    if (completion.filter(Boolean).length === 7) {
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  }, [completion]);

  const toggleCompletion = async (index) => {
    const updated = [...completion];
    updated[index] = !updated[index];
    setCompletion(updated);

    const ref = doc(db, 'users', firebaseAuth.currentUser.uid);
    await setDoc(ref, {
      gptAnalysis: {
        completion: updated
      }
    }, { merge: true });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loading}>Loading your plan...</Text>
      </View>
    );
  }

  if (!planItems.length) {
    return (
      <View style={styles.centered}>
        <Text>No plan found. Log your habits to get started!</Text>
      </View>
    );
  }

  const validPlanItems = planItems.filter(item => item && item.toLowerCase().startsWith("day"));
  const completedCount = completion.filter(Boolean).length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your 7-Day Heart Plan</Text>

      {completion.length > 0 && (
        <>
          <Progress.Bar
            progress={completedCount / 7}
            width={null}
            height={12}
            color="#4CAF50"
            unfilledColor="#ddd"
            borderRadius={8}
            borderWidth={0}
            style={styles.progressBar}
          />
          <Text style={styles.progressLabel}>
            {completedCount} of 7 days completed
          </Text>
        </>
      )}

      {validPlanItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.card, completion[index] && styles.cardDone]}
          onPress={() => toggleCompletion(index)}
        >
          <Text style={styles.day}>{item}</Text>
          <Text style={styles.status}>{completion[index] ? '✅ Done' : '⭕ Not Yet'}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.sectionFooter}>
        <Text style={styles.motivation}>
          💡 Keep it up! You're building a heart-healthy routine one step at a time.
        </Text>

        {showConfetti && (
          <>
            <ConfettiCannon
              count={150}
              origin={{ x: 200, y: 0 }}
              fadeOut={true}
            />
            <Text style={styles.congratsText}>🎉 You completed all 7 days!</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => {
                router.replace('/habitlogger');
              }}>
                <Text style={styles.buttonText}>Log New Habits</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={async () => {
                const ref = doc(db, 'users', firebaseAuth.currentUser.uid);
                await setDoc(ref, {
                  forceRegenerate: true
                }, { merge: true });
                router.replace('/'); // go back to dashboard to regenerate plan
              }}>
                <Text style={styles.buttonText}>Generate New Plan</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    marginTop: 10,
    fontSize: 16,
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
    backgroundColor: '#D1FAD7',
  },
  day: {
    fontSize: 16,
  },
  status: {
    fontSize: 14,
    marginTop: 8,
    color: '#555',
  },
  sectionFooter: {
    marginTop: 24,
    alignItems: 'center',
  },
  motivation: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#444',
    textAlign: 'center',
  },
  progressBar: {
    marginBottom: 16,
  },
  progressLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
  },
  congratsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
