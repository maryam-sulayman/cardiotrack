// src/components/Header.js
import Avatar from '@/components/Avatar';
import PlanBell from '@/components/PlanBell';
import { firebaseAuth } from '@/config/firebaseConfig';
import { format } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';

const Header = ({ name, weeklyPlan, imageURL }) => {
  const authUser = firebaseAuth.currentUser;

  // Prefer explicit props from Firestore, else fall back to Auth user, else generic.
  const displayName = name || authUser?.displayName || 'there';
  const avatarUri = imageURL || authUser?.photoURL || null;

  return (
    <View>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Avatar
            name={displayName}
            uri={avatarUri}      // Cloudinary (imageURL) or Firebase Auth photoURL
            size={50}
            bg="#6B21A8"
          />

          <View style={styles.greetingBox}>
            <Text style={styles.greetingText}>Hey, {displayName.split(' ')[0]}</Text>
            <Text style={styles.dateText}>{format(new Date(), 'EEE, MMM dd yyyy')}</Text>
          </View>
        </View>

        <View style={styles.calendarButton}>
          <PlanBell weeklyPlan={weeklyPlan || []} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  greetingBox: { justifyContent: 'center', marginLeft: 12 },
  greetingText: { fontSize: 15, color: '#666', marginBottom: 5 },
  dateText: { fontSize: 18, color: '#222', fontWeight: 'bold' },
  calendarButton: {},
});

export default Header;
