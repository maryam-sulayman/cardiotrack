import { db, firebaseAuth } from '@/config/firebaseConfig';
import { titleCaseName } from '@/utils/text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  collection,
  doc, getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [latestLog, setLatestLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const user = firebaseAuth.currentUser;
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        // Profile
        const refUser = doc(db, 'users', user.uid);
        const snap = await getDoc(refUser);
        if (snap.exists()) setProfile(snap.data());

        // Latest habit log (for water/sleep/steps/etc.)
        const q = query(
          collection(db, 'habitLogs'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const logSnap = await getDocs(q);
        if (!logSnap.empty) setLatestLog(logSnap.docs[0].data());
      } catch (e) {
        console.error('Failed to load profile/logs', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please allow access to your gallery.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1,1], quality: 0.8
    });
    if (pickerResult.canceled) return;

    try {
      setUploading(true);
      const imageUri = pickerResult.assets[0].uri;
      const storage = getStorage();
      const imageRef = ref(storage, `profileImages/${user.uid}.jpg`);
      const resp = await fetch(imageUri);
      const blob = await resp.blob();
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      await setDoc(doc(db, 'users', user.uid), { imageURL: downloadURL }, { merge: true });
      setProfile((p) => ({ ...p, imageURL: downloadURL }));
    } catch (e) {
      console.error('Image upload failed:', e);
      Alert.alert('Error', 'Failed to upload image. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try { await firebaseAuth.signOut(); router.replace('/'); }
    catch { Alert.alert('Error', 'Failed to log out. Please try again.'); }
  };

  const bmi = useMemo(() => {
    if (!profile?.height || !profile?.weight) return null;
    const v = profile.weight / Math.pow(profile.height / 100, 2);
    return Math.round(v * 10) / 10;
  }, [profile]);

  // Read canonical % risk + heart age from gptAnalysis (same as dashboard)
  const heartRisk = profile?.gptAnalysis?.heartRisk ?? null;
  const heartAge  = profile?.gptAnalysis?.heartAge ?? null;
  const riskUpdatedAt = profile?.gptAnalysis?.generatedAt?.toDate?.() || profile?.gptAnalysis?.generatedAt || null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF7043" />
        <Text style={{ marginTop: 8 }}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text>Profile not found. Please complete your setup.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/profile-setup')}>
          <Text style={styles.primaryBtnText}>Go to Profile Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Image
              source={profile?.imageURL ? { uri: profile.imageURL } : require('@/assets/images/person.png')}
              style={styles.avatar}
            />
            <View style={styles.avatarRing} />
            <TouchableOpacity style={styles.editChip} onPress={handleImageUpload} activeOpacity={0.85}>
              {uploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialCommunityIcons name="pencil" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{titleCaseName(profile?.name || '')}</Text>
          <Text style={styles.emailText}>{user?.email}</Text>

          <View style={styles.infoChips}>
            <Chip icon="account" label={profile.gender || '—'} />
            <Chip icon="calendar" label={String(profile.age ?? '—')} />
            <Chip icon="earth" label={profile.ethnicity || '—'} />
          </View>
        </View>

        {/* Risk (Framingham) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cardiovascular risk</Text>
          <View style={styles.riskRowTop}>
            <Text style={styles.riskBig}>{heartRisk != null ? `${heartRisk.toFixed?.(1) ?? heartRisk}%` : '—'}</Text>
            {heartAge != null && (
              <View style={styles.pill}>
                <MaterialCommunityIcons name="heart-pulse" size={14} color="#6A0DAD" />
                <Text style={styles.pillText}>Heart age: {heartAge}</Text>
              </View>
            )}
          </View>
          {riskUpdatedAt && (
            <Text style={styles.riskMeta}>
              Updated {new Date(riskUpdatedAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Body */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Body</Text>
          <View style={styles.gridRow}>
            <Stat label="Height" value={`${profile.height ?? '—'} cm`} />
            <Stat label="Weight" value={`${profile.weight ?? '—'} kg`} />
            <Stat label="BMI" value={bmi ?? '—'} />
          </View>
        </View>

        {/* Recent habits (no ML score shown) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent logged habits</Text>
          <View style={styles.gridRow}>
            <Stat label="Water" value={latestLog?.water != null ? `${latestLog.water} L` : '—'} />
            <Stat label="Sleep" value={latestLog?.sleep != null ? `${latestLog.sleep} hrs` : '—'} />
            <Stat label="Steps" value={latestLog?.steps != null ? latestLog.steps.toLocaleString() : '—'} />
            <Stat label="Stress" value={latestLog?.stress != null ? `${latestLog.stress}/10` : '—'} />
            <Stat label="Smoking" value={latestLog?.smoking ? 'Yes' : (latestLog ? 'No' : '—')} />
            <Stat
              label="Blood Pressure"
              value={
                latestLog?.ap_hi != null && latestLog?.ap_lo != null
                  ? `${latestLog.ap_hi}/${latestLog.ap_lo} mmHg`
                  : '—'
              }
            />
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/profile-setup')} activeOpacity={0.9}>
          <MaterialCommunityIcons name="account-edit" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout} activeOpacity={0.9}>
          <MaterialCommunityIcons name="logout" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.dangerBtnText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ icon, label }) {
  return (
    <View style={styles.chip}>
      <MaterialCommunityIcons name={icon} size={14} color="#6A0DAD" />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { alignItems: 'center', marginBottom: 16 },
  avatarWrap: { width: 124, height: 124, borderRadius: 62, position: 'relative', marginBottom: 10 },
  avatar: { width: '100%', height: '100%', borderRadius: 62, backgroundColor: '#F3F4F6' },
  avatarRing: { position: 'absolute', inset: 0, borderRadius: 62, borderWidth: 3, borderColor: '#EDE9FE' },
  editChip: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: '#FF7043', height: 34, paddingHorizontal: 10,
    borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  name: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  emailText: { marginTop: 2, color: '#6B7280' },

  infoChips: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#F5F3FF', borderColor: '#EDE9FE', borderWidth: 1,
    borderRadius: 999,
  },
  chipText: { color: '#4B5563', fontWeight: '600', fontSize: 12 },

  card: {
    padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#EDE9FE',
    backgroundColor: '#FAF7FF', marginTop: 10, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#2D0A4A', marginBottom: 8 },

  // Risk card
  riskRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  riskBig: { fontSize: 28, fontWeight: '900', color: '#1F2937' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: '#F4ECFF', borderColor: '#E6DAFF', borderWidth: 1,
  },
  pillText: { color: '#6A0DAD', fontWeight: '800' },
  riskMeta: { marginTop: 6, color: '#6B7280', fontSize: 12 },

  // Stat grid
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    flexBasis: '31%', flexGrow: 1,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1EAFD',
    alignItems: 'center',
  },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginTop: 4 },

  // Buttons
  primaryBtn: {
    backgroundColor: '#FF7043',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  dangerBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 10, marginBottom: 50,
  },
  dangerBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
