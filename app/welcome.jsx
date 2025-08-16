import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    // No background color; inherits whatever is behind it
    <View style={styles.container}>
      {/* Logo */}
      <View style={{ paddingTop: 130 }}>
        <View style={styles.logoBox}>
          <LottieView
            source={require('@/assets/animations/welcome.json')}
            autoPlay
            loop
            style={{ width: 160, height: 160 }}
            enableMergePathsAndroidForKitKatAndAbove
            renderMode="AUTOMATIC"
          />
          <Text style={styles.logoText}>CardioTrack</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.subtitle}>Your heart, your health, your AI</Text>
        <Text style={styles.smallText}>Login to stay healthy and fit</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/auth/login')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryText}>Sign In</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/signup')}
          activeOpacity={0.9}
        >
          <Text style={styles.secondaryText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          CardioTrack is for information and habit-building only. It is not a tool for diagnosis or
          emergency care and does not replace professional medical advice.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent', // or '#fff' if you want white
  },
  logoBox: { alignItems: 'center', marginBottom: 20 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#111', marginTop: 10 },
  subtitle: { fontSize: 18, color: '#374151', marginBottom: 8, textAlign: 'center' },
  smallText: { fontSize: 14, color: '#6B7280', marginBottom: 40, textAlign: 'center' },

  buttons: { width: '100%', paddingBottom: 60 },
  primaryButton: {
    backgroundColor: '#A020F0',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 20,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: .3,
    borderRadius: 30,
    borderColor: '#6A0DAD',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: { color: '#6A0DAD', fontSize: 16, fontWeight: 'bold' },
  disclaimer: {
    marginTop: 22,
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
