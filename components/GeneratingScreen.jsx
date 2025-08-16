// components/GeneratingScreen.jsx
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// working lottie file
const ANIM = require('@/assets/animations/heart-beat.json');

function Dots({ color = '#6A0DAD', size = 16, interval = 420 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN(v => (v + 1) % 4), interval);
    return () => clearInterval(id);
  }, [interval]);
  return <Text style={{ color, fontSize: size, fontWeight: '700' }}>{'.'.repeat(n)}</Text>;
}

export default function GeneratingScreen({ name = 'there' }) {
  const first = name?.trim() ? name.trim().split(' ')[0] : 'there';

  return (
    // set backgroundColor to 'transparent' if you want it to inherit the parent
    <View style={[styles.container, { backgroundColor: '#fff' }]}>
      <View style={styles.center}>
        <LottieView
          source={ANIM}
          autoPlay
          loop
          style={{ width: 120, height: 120 }}
          enableMergePathsAndroidForKitKatAndAbove
          renderMode="AUTOMATIC"
        />

        <Text style={styles.title}>Building your heart plan</Text>
        <Text style={styles.subtitle}>
          Hang tight, {first}! Your heart plan is on the way.        </Text>

        <View style={styles.row}>
          <Text style={styles.status}>Generating</Text>
          <Dots />
        </View>

        <Text style={styles.hint}>Usually ~10–15 seconds</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  center: { alignItems: 'center' },
  title: { color: '#111', fontSize: 21, fontWeight: '', letterSpacing: 0.3, marginTop: 8, textAlign: 'center' },
  subtitle: {
    color: '#4B5563', fontSize: 14, textAlign: 'center',
    marginTop: 6, lineHeight: 20, maxWidth: 320,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  status: { color: '#6A0DAD', fontWeight: '800' },
  hint: { color: '#7a7d83ff', fontSize: 13, marginTop: 8 },
});
