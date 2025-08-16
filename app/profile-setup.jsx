// app/(screens)/ProfileSetup.jsx
import { db, firebaseAuth } from '@/config/firebaseConfig';
import { titleCaseName } from '@/utils/text';
import { uploadToCloudinary } from '@/utils/uploadToCloudinary';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** ──────────────────────────────────────────────────────────────
 *  Ethnicity options (simple modal dropdown)
 *  ────────────────────────────────────────────────────────────── */
const ETHNICITY_OPTIONS = [
  'White',
  'Black / African',
  'Asian',
  'Mixed',
  'Hispanic / Latino',
  'Middle Eastern',
  'South Asian',
  'East Asian',
  'Southeast Asian',
  'Indigenous',
  'Other / Prefer not to say',
];

export default function ProfileSetup() {
  const router = useRouter();
  const user = firebaseAuth.currentUser;
  const initialName = user?.displayName || '';

  const [name, setName] = useState(initialName);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [ethModal, setEthModal] = useState(false);

  const isValid = useMemo(() => {
    return (
      name &&
      age && !isNaN(age) &&
      height && !isNaN(height) &&
      weight && !isNaN(weight) &&
      ethnicity
    );
  }, [name, age, height, weight, ethnicity]);

  const validate = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Full Name is required';
    if (!age || isNaN(age)) newErrors.age = 'Valid age required';
    if (!height || isNaN(height)) newErrors.height = 'Height is required';
    if (!weight || isNaN(weight)) newErrors.weight = 'Weight is required';
    if (!ethnicity) newErrors.ethnicity = 'Ethnicity is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!validate()) return;

    const authUser = firebaseAuth.currentUser;
    if (!authUser) {
      Alert.alert('Not signed in', 'Please sign in again.');
      return;
    }

    const cleanedName = titleCaseName(name);

    try {
      setSaving(true);
      let imageURL = null;
      let publicId = null;

      if (image) {
        // Give each user image a stable-ish name; useful if you let users replace later.
        const cloudResult = await uploadToCloudinary(image, {
          publicId: `${authUser.uid}-${Date.now()}`,
        });
        imageURL = cloudResult.avatarUrl; // Use the transformed avatar in your UI
        publicId = cloudResult.publicId;
      }

      await setDoc(
        doc(db, 'users', authUser.uid),
        {
          name: cleanedName,
          gender,
          age: parseInt(age, 10),
          height: parseFloat(height),
          weight: parseFloat(weight),
          ethnicity,
          imageURL: imageURL || null,
          imagePublicId: publicId || null,
          profileCompleted: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      await updateProfile(authUser, {
        displayName: cleanedName,
        photoURL: imageURL || null,
      });

      Alert.alert('Success', 'Profile setup complete!');
      router.replace('/(tabs)/habitlogger');
    } catch (error) {
      console.error('Profile setup error:', error);
      Alert.alert('Error', error?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Set Up Your Profile</Text>

            {/* Profile Image */}
            <View style={styles.imageWrapper}>
              <Image
                source={image ? { uri: image } : (user?.photoURL ? { uri: user.photoURL } : require('@/assets/images/person.png'))}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.editIcon} onPress={handleImageUpload} activeOpacity={0.9}>
                <Ionicons name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Full Name */}
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="done"
            />
            {errors.name && <Text style={styles.error}>{errors.name}</Text>}

            {/* Gender */}
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderButton, gender === g && styles.genderActive]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Age */}
            <Text style={styles.label}>Age</Text>
            <TextInput
              placeholder="Enter your age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              style={styles.input}
            />
            {errors.age && <Text style={styles.error}>{errors.age}</Text>}

            {/* Height */}
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              placeholder="Enter your height"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              style={styles.input}
            />
            {errors.height && <Text style={styles.error}>{errors.height}</Text>}

            {/* Weight */}
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              placeholder="Enter your weight"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              style={styles.input}
            />
            {errors.weight && <Text style={styles.error}>{errors.weight}</Text>}

            {/* Ethnicity (Dropdown modal) */}
            <Text style={styles.label}>Ethnicity</Text>
            <Pressable style={styles.selectInput} onPress={() => setEthModal(true)}>
              <Text style={[styles.selectText, !ethnicity && { color: '#9CA3AF' }]}>
                {ethnicity || 'Select your ethnicity'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#6B7280" />
            </Pressable>
            {errors.ethnicity && <Text style={styles.error}>{errors.ethnicity}</Text>}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.primaryButton, !isValid && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={!isValid || saving}
              activeOpacity={0.9}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Profile →</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Ethnicity modal */}
      <Modal visible={ethModal} transparent animationType="fade" onRequestClose={() => setEthModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEthModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Ethnicity</Text>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingVertical: 8 }}>
              {ETHNICITY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => { setEthnicity(opt); setEthModal(false); }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    ethnicity === opt && styles.optionRowActive,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={[styles.optionText, ethnicity === opt && styles.optionTextActive]}>{opt}</Text>
                  {ethnicity === opt && <Ionicons name="checkmark" size={16} color="#fff" />}
                </Pressable>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setEthModal(false)} style={styles.modalCloseBtn} activeOpacity={0.9}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 20 },

  imageWrapper: { alignItems: 'center', marginBottom: 20, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee' },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#6A0DAD',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 20,
  },

  label: { fontSize: 16, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },

  genderRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  genderButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 8,
  },
  genderActive: { backgroundColor: '#6A0DAD', borderColor: '#6A0DAD' },
  genderText: { fontSize: 16, color: '#333' },
  genderTextActive: { color: '#fff' },

  // Select input (Ethnicity)
  selectInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: { fontSize: 16, color: '#111' },

  primaryButton: {
    backgroundColor: '#6A0DAD',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: 'red', fontSize: 14, marginBottom: 8 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 3, 3, 0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 10 },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionRowActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },
  optionText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  optionTextActive: { color: '#fff' },
  modalCloseBtn: {
    marginTop: 8,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontWeight: '800' },
});
