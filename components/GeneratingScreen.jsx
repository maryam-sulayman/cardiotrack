import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function GeneratingScreen({ name = 'there' }) {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('@/assets/animations/heart-beat.json')}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
      />
      <Text style={styles.text}>💖 Hang tight, {name}! Your heart plan is on the way...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontSize: 16,
    marginTop: 20,
    color: '#444',
    textAlign: 'center',
  },
});
