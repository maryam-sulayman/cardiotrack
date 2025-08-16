// HabitLogger.jsx
import { db, firebaseAuth } from '@/config/firebaseConfig';
import { getHeartRiskScore } from '@/utils/heartRisk';
import { scheduleWeeklyPlan } from '@/utils/planNotifications';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ANALYZE_URL = 'http://192.168.1.102:8000/analyze'; // <-- your Flask server

const UnitInput = React.memo(function UnitInput({
  value,
  onChangeText,
  placeholder,
  unit,
  keyboardType = 'numeric',
  style,
  returnKeyType = 'done',
  blurOnSubmit = false,
  ...rest
}) {
  const strValue = typeof value === 'string' ? value : String(value ?? '');

  return (
    <View style={[styles.unitInputWrap, style]}>
      <TextInput
        style={[styles.cardInput, { paddingRight: 56 }]}
        value={strValue}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={styles.placeholder.color}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        blurOnSubmit={blurOnSubmit}
        autoCorrect={false}
        autoCapitalize="none"
        scrollEnabled={false}
        {...rest}
      />
      <View style={styles.unitBadge} pointerEvents="none">
        <Text style={styles.unitBadgeText}>{unit}</Text>
      </View>
    </View>
  );
});

export default function HabitLogger() {
  const [water, setWater] = useState('');
  const [sleep, setSleep] = useState('');
  const [steps, setSteps] = useState('');
  const [stress, setStress] = useState(5);
  const [smoking, setSmoking] = useState(false);
  const [apHi, setApHi] = useState('');
  const [apLo, setApLo] = useState('');

  const router = useRouter();
  const accessoryId = 'done-bar';

  const GOALS = { waterL: 3, steps: 8000, sleepHrs: 8 };
  const COLORS = {
    water: '#2196F3',
    sleep: '#9C27B0',
    steps: '#4CAF50',
    stress: '#FF9800',
    smoke: '#F44336',
    bp: '#E91E63',
  };
  const pct = (num = 0, den = 1) => Math.max(0, Math.min(1, num / den));

  const handleSubmit = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    try {
      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};

      // Sanitize/clamp values a bit
      const habitData = {
        water: Math.max(0, Math.min(10, parseFloat(water) || 0)),
        sleep: Math.max(0, Math.min(24, parseFloat(sleep) || 0)),
        steps: Math.max(0, parseInt(steps) || 0),
        stress: Math.max(1, Math.min(10, Number(stress) || 5)),
        smoking,
        ap_hi: parseInt(apHi) || 0,
        ap_lo: parseInt(apLo) || 0,
      };

      // Optional local score (you already had this)
      const combined = { ...profileData, ...habitData };
      const { score, risk } = getHeartRiskScore(combined);

      // 1) Save the raw habit entry
      await addDoc(collection(db, 'habitLogs'), {
        ...habitData,
        uid: user.uid,
        heartScore: score,
        riskLevel: risk,
        createdAt: serverTimestamp(),
      });

      // 2) Call backend to generate plan
      const bmi =
        profileData?.height && profileData?.weight
          ? profileData.weight / ((profileData.height / 100) ** 2)
          : 0;

      const body = {
        age: profileData.age,
        gender: profileData.gender,
        ethnicity: profileData.ethnicity || 'unspecified',
        bmi,
        ap_hi: habitData.ap_hi || profileData.ap_hi || 120,
        ap_lo: habitData.ap_lo || profileData.ap_lo || 80,
        smoking: habitData.smoking,
        stress: habitData.stress,
        steps: habitData.steps,
        water: habitData.water,
        sleep: habitData.sleep,
        completion: profileData?.gptAnalysis?.completion || [],
      };

      const resp = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Analyze failed');
      }

      // 3) Save plan + summary to user doc
      const weeklyPlan = Array.isArray(data.weekly_plan) ? data.weekly_plan : [];

      await setDoc(
        profileRef,
        {
          gptAnalysis: {
            ...profileData.gptAnalysis,
            weeklyPlan,
            completion: new Array(7).fill(false),
            clinicalSummary: data.clinical_summary,
            summaryBullets: data.dashboard_summary,
            heartRiskPercent: data.heart_risk_percent,
            estimatedHeartAge: data.estimated_heart_age,
            // mirror latest inputs for the next request
            ap_hi: habitData.ap_hi,
            ap_lo: habitData.ap_lo,
            smoking: habitData.smoking,
            stress: habitData.stress,
            steps: habitData.steps,
          },
          lastHabitLogAt: serverTimestamp(),
          hasLoggedOnce: true,
        },
        { merge: true }
      );

      // 4) Schedule reminders ONLY if a real plan exists
      try {
        if (weeklyPlan.length === 7) {
          await scheduleWeeklyPlan(weeklyPlan, {
            requireTime: true,
            nudgeTime: '21:00',
          });
        }
      } catch (e) {
        console.warn('Failed to schedule reminders:', e?.message || e);
      }

      Alert.alert('Success', 'Habits logged and analysed!');
      router.replace('/');
    } catch (error) {
      Alert.alert(
        'Error',
        'Something went wrong: ' + (error?.message ?? String(error))
      );
    }
  };

  const stepVal = parseInt(steps) || 0;
  const canDec = stepVal > 0;
  const waterPct = pct(Number(water) || 0, GOALS.waterL) * 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* iOS numeric keypad dismiss bar */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={{ alignItems: 'flex-end', padding: 8, backgroundColor: '#f2f2f7' }}>
            <Button title="Done" onPress={() => Keyboard.dismiss()} />
          </View>
        </InputAccessoryView>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Log Your Daily Habits</Text>

          {/* Water */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLabelRow}>
                <MaterialCommunityIcons name="cup-water" size={22} color={COLORS.water} />
                <Text style={styles.cardLabel}>Water Intake</Text>
              </View>
              <Text style={styles.cardValue}>
                {(parseFloat(water) || 0).toFixed(1)} L / {GOALS.waterL} L
              </Text>
            </View>

            <UnitInput
              value={water}
              onChangeText={setWater}
              placeholder="e.g. 2.5"
              unit="L"
              keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
              inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
              returnKeyType="done"
              blurOnSubmit={false}
            />

            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[COLORS.water, '#7EC8FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${waterPct}%` }]}
              />
            </View>
          </View>

          {/* Sleep */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLabelRow}>
                <Ionicons name="moon-outline" size={22} color={COLORS.sleep} />
                <Text style={styles.cardLabel}>Sleep</Text>
              </View>
              <Text style={styles.cardValue}>
                {parseFloat(sleep) || 0} / {GOALS.sleepHrs} hrs
              </Text>
            </View>
            <UnitInput
              value={sleep}
              onChangeText={setSleep}
              placeholder="e.g. 7"
              unit="hrs"
              keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
              inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
              returnKeyType="done"
              blurOnSubmit={false}
            />
          </View>

          {/* Steps with steppers */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLabelRow}>
                <MaterialCommunityIcons name="walk" size={22} color={COLORS.steps} />
                <Text style={styles.cardLabel}>Steps</Text>
              </View>
              <Text style={styles.cardValue}>
                {stepVal.toLocaleString()} / {GOALS.steps.toLocaleString()}
              </Text>
            </View>

            <View style={styles.row}>
              <Pressable
                onPress={() => canDec && setSteps(String(Math.max(0, stepVal - 500)))}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  { backgroundColor: '#E8F5E9' },
                  !canDec && styles.stepperBtnDisabled,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={[styles.stepperBtnText, { color: COLORS.steps }]}>– 500</Text>
              </Pressable>

              <TextInput
                style={[styles.cardInput, { flex: 1, textAlign: 'center' }]}
                keyboardType="numeric"
                inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
                value={steps}
                onChangeText={setSteps}
                placeholder="e.g. 8000"
                placeholderTextColor={styles.placeholder.color}
                returnKeyType="done"
                blurOnSubmit={false}
              />

              <Pressable
                onPress={() => setSteps(String(stepVal + 500))}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  { backgroundColor: '#E8F5E9' },
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={[styles.stepperBtnText, { color: COLORS.steps }]}>+ 500</Text>
              </Pressable>
            </View>
          </View>

          {/* Stress */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLabelRow}>
                <Ionicons name="alert-circle-outline" size={22} color={COLORS.stress} />
                <Text style={styles.cardLabel}>Stress Level</Text>
              </View>
              <Text style={[styles.cardValue, { color: COLORS.stress }]}>{stress}</Text>
            </View>

            <Slider
              style={{ width: '100%', height: 40 }}
              value={stress}
              onValueChange={(v) => setStress(Math.round(v))}
              minimumValue={1}
              maximumValue={10}
              step={1}
              minimumTrackTintColor={COLORS.stress}
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor={COLORS.stress}
            />
            <View style={styles.sliderTicks}>
              <Text style={styles.tick}>1</Text>
              <Text style={styles.tick}>10</Text>
            </View>
          </View>

          {/* Smoking */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLabelRow}>
                <MaterialCommunityIcons name="smoking" size={22} color={COLORS.smoke} />
                <Text style={styles.cardLabel}>Smoking</Text>
              </View>
              <Text style={[styles.cardValue, { color: smoking ? COLORS.smoke : COLORS.steps }]}>
                {smoking ? 'Yes' : 'No'}
              </Text>
            </View>

            <View style={styles.switchRow}>
              <Text style={{ color: '#666' }}>No</Text>
              <Switch
                value={smoking}
                onValueChange={setSmoking}
                trackColor={{ false: '#E0E0E0', true: '#F8BBD0' }}
                thumbColor={smoking ? '#F44336' : '#fff'}
              />
              <Text style={{ color: '#666' }}>Yes</Text>
            </View>
          </View>

          {/* Blood Pressure */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLabelRow}>
                <MaterialCommunityIcons name="heart-pulse" size={22} color={COLORS.bp} />
                <Text style={styles.cardLabel}>Blood Pressure</Text>
              </View>
              <Text style={[styles.cardValue, { color: COLORS.bp }]}>mmHg</Text>
            </View>

            <View style={styles.row}>
              <UnitInput
                value={apHi}
                onChangeText={setApHi}
                placeholder="Systolic"
                placeholderTextColor={styles.placeholder.color}
                unit="mmHg"
                keyboardType="numeric"
                inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
                returnKeyType="done"
                blurOnSubmit
                style={{ flex: 1 }}
              />
              <View style={{ width: 10 }} />
              <UnitInput
                value={apLo}
                onChangeText={setApLo}
                placeholder="Diastolic"
                placeholderTextColor={styles.placeholder.color}
                unit="mmHg"
                keyboardType="numeric"
                inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
                returnKeyType="done"
                blurOnSubmit
                style={{ flex: 1 }}
              />
            </View>
          </View>

          <Pressable onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitText}>Submit & Generate Plan</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#F3EAFE',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardLabelRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLabel: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#111' },
  cardValue: { fontWeight: '700', color: '#333' },

  placeholder: { color: '#9B8AC8' },

  unitInputWrap: { position: 'relative' },
  unitBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    bottom: 8,
    alignSelf: 'center',
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#EEE5FF',
    justifyContent: 'center',
  },
  unitBadgeText: { fontWeight: '600', color: '#6A0DAD' },

  cardInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E3D7FF',
    color: '#111',
  },

  progressTrack: {
    height: 6,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#E8E2FF',
    marginTop: 10,
  },
  progressFill: { height: '100%', minWidth: 6 },

  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

  stepperBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperBtnText: { fontWeight: '700' },

  switchRow: {
    marginTop: 6,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sliderTicks: { flexDirection: 'row', justifyContent: 'space-between' },
  tick: { color: '#999', fontSize: 15 },

  submitButton: {
    backgroundColor: '#4f1b78',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
