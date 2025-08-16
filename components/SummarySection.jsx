import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const SummarySection = ({ summaryBullets = [], clinicalSummary, modalVisible, setModalVisible }) => {
  return (
    <View>
      <Text style={styles.sectionTitle}>How You're Doing <MaterialCommunityIcons
                          name="account-heart"
                          size={23}
                          color={'#60c8f5ff'}
                        /></Text>

      <View style={styles.wrapper}>
        {summaryBullets.slice(0,3).map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View style={[styles.iconBadge, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="check-decagram" size={18} color="#2E7D32" />
            </View>
            <Text style={styles.cardText}>{item}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setModalVisible(true)}>
          <MaterialCommunityIcons name="file-document-outline" size={18} color="#6A0DAD" />
          <Text style={styles.seeMoreText}>See Full Summary</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Full Clinical Summary</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#444" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              {!!clinicalSummary && (
                <View style={styles.clinicalBlock}>
                  <Text style={styles.clinicalTitle}>Clinician Notes</Text>
                  <Text style={styles.clinicalText}>{clinicalSummary}</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 30,
  },
  wrapper: {
    backgroundColor: '#F5F0FF',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#3B2F4A',
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4D6FF',
    backgroundColor: '#FBF8FF',
    marginTop: 2,
  },
  seeMoreText: {
    color: '#6A0DAD',
    fontWeight: '700',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  clinicalBlock: {
    marginTop: 14,
    backgroundColor: '#FAF7FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFE6FF',
  },
  clinicalTitle: { fontWeight: '700', marginBottom: 6, color: '#4B3A66' },
  clinicalText: { fontSize: 14, lineHeight: 20, color: '#3A2E49' },
  closeBtn: {
    marginTop: 10,
    backgroundColor: '#6A0DAD',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  closeBtnText: { color: '#fff', fontWeight: '700' },
});

export default SummarySection;
