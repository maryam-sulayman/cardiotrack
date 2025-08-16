import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const HeartScoreCard = ({ heartRisk, heartAge }) => {

  const getRiskBadge = () => {
    if (heartRisk === null) return { label: 'Unknown', color: '#6B21A8' };
    if (heartRisk < 10) return { label: 'Low', color: '#2E7D32' };
    if (heartRisk < 20) return { label: 'Moderate', color: '#FB8C00' };
    return { label: 'High', color: '#D32F2F' };
  };

  const badge = getRiskBadge();

  return (
    <View>
      <Text style={styles.sectionTitle}>Your Heart Score <Ionicons
                          name="pulse"
                          size={23}
                          color={badge.color}
                        /></Text>
      <View style={styles.heartCard}>
        
        {/* Heart Risk */}
        <View style={styles.heartRiskBox}>
          <Text style={styles.label}>Heart Risk</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>
              {heartRisk ?? '--'}%
            </Text>
            <View style={[styles.badge, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeText}>{badge.label}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Heart Age */}
        <View style={styles.heartAgeBox}>
          <Text style={styles.label}>Heart Age</Text>
          <Text style={styles.value}>{heartAge ?? '--'}</Text>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { 
    fontSize: 19, 
    fontWeight: '700', 
    marginVertical: 12 
  },
  heartCard: {
    flexDirection: 'row',
    backgroundColor: '#DDBDFF', 
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
elevation: 4,},
  heartRiskBox: {
    flex: 1,
    alignItems: 'flex-start',
  },
  heartAgeBox: {
    flex: 1,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#ddd',
    marginHorizontal: 20,
  },
});

export default HeartScoreCard;
