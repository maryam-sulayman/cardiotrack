// app/(tabs)/plan.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { firebaseAuth, db } from '@/config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Checkbox from 'expo-checkbox';

export default function PlanScreen() {
  const user = firebaseAuth.currentUser;
  const [plan, setPlan] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const storedPlan = data.plan || [];
          setPlan(storedPlan);

          // Pre-fill checkbox states as false
          const defaults = {};
          storedPlan.forEach((item, index) => {
            const key = item.task || item;
            defaults[key] = false;
          });
          setCheckedItems(defaults);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load plan');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const toggleCheckbox = (key) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📝 Your Current 7-Day Plan</Text>

      {plan.length === 0 && (
        <Text style={styles.placeholder}>No plan found. Go log habits to generate one!</Text>
      )}

      {plan.map((item, index) => {
        const label = item.task || item;
        return (
          <View key={index} style={styles.itemRow}>
            <Checkbox
              value={checkedItems[label] || false}
              onValueChange={() => toggleCheckbox(label)}
              style={styles.checkbox}
            />
            <Text style={styles.itemText}>{label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  placeholder: {
    fontSize: 16,
    color: '#666'
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  checkbox: {
    marginRight: 12
  },
  itemText: {
    fontSize: 16
  }
});