// components/MealPlanList.js
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const UNSPLASH_ACCESS_KEY = "5Lv379cBcRn7VofMCcvAudbL0l_5SIueJGbueP2_2ws";
const DEFAULT_MEAL_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80";

const MealCard = ({ title, meal }) => {
  const [imgUrl, setImgUrl] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(meal.name)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1`
        );
        const data = await response.json();
        const url = data.results?.[0]?.urls?.small || DEFAULT_MEAL_IMAGE;
        setImgUrl(url);
      } catch {
        setImgUrl(DEFAULT_MEAL_IMAGE);
      }
    };
    if (meal?.name) fetchImage();
  }, [meal?.name]);

  return (
    <View style={styles.mealCard}>
      {/* image + badge */}
      <View style={styles.imageWrap}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.mealImage} />
        ) : (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#FF7043" />
          </View>
        )}

        {/* badge */}
        <LinearGradient
          colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.35)']}
          start={{ x: 0, y: 0 }}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>{title} ✨</Text>
        </LinearGradient>
      </View>

      {/* text */}
      <Text style={styles.mealName}>{meal?.name}</Text>
      <Text style={styles.mealDesc}>{meal?.desc}</Text>
      <Text style={styles.ingredientsTitle}>Ingredients:</Text>
    <Text style={styles.ingredientsText}>
    {meal?.ingredients
      ?.map(item => `- ${item.trim().charAt(0).toUpperCase() + item.trim().slice(1)}`)
      .join('\n')}
  </Text>
  {/* spacer to push button down */}
  <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.recipeButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.recipeButtonText}>View Recipe</Text>
      </TouchableOpacity>

      {/* Recipe Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{meal?.name} - Recipe</Text>
            <ScrollView>
              {meal?.steps?.map((step, idx) => (
                <Text key={idx} style={styles.modalStep}>{step}</Text>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const MealPlanList = ({ mealTips, onGenerateNew }) => {
  const mealSections = ["Breakfast", "Lunch", "Dinner"];
  const mealItems = mealTips ? [mealTips.breakfast, mealTips.lunch, mealTips.dinner] : [];

  return (
    <View style={{ paddingTop: 20 }}>
      <Text style={styles.sectionTitle}>Today's Meal Plan  <Ionicons
                          name="restaurant"
                          size={23}
                          color={'#470775ff'}
                        /></Text>

      <FlatList
        data={mealSections}
        horizontal
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <MealCard title={item} meal={mealItems[index]} />
        )}
        showsHorizontalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.generateButton} onPress={onGenerateNew}>
         <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
        <Text style={styles.generateButtonText}>Generate New Meal Plan</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 19, fontWeight: '700', marginVertical: 15 },

  mealCard: {
    backgroundColor: "#FFF4E5",
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    width: 260,
    minHeight: 300,
    flexDirection: 'column',
  },

  imageWrap: {
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative', // 👈 needed for absolute badge
  },
  mealImage: { width: '100%', height: '100%' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // badge over image
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: '#fff',
  
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.2 },
  mealName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  mealDesc: { fontSize: 14, color: "#555", marginBottom: 6, lineHeight: 20},
  ingredientsTitle: { fontWeight: "700", fontSize: 14, marginTop: 4 },
  ingredientsText: { fontSize: 13, color: "#444", marginTop: 4, lineHeight: 20, marginBottom: 12 },

  recipeButton: {
 marginTop: 'auto',    
  backgroundColor: '#4f1b78ff',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center',
  },
  recipeButtonText: { color: "#fff", fontWeight: "bold" },

  generateButton: {
    backgroundColor: "#FF7043",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  generateButtonText: { color: "#fff", fontWeight: "bold" },

  /* Modal styles */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 12, width: "90%", maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalStep: { fontSize: 14, color: "#333", marginBottom: 8 },
  closeButton: { marginTop: 20, backgroundColor: "#FF7043", padding: 10, borderRadius: 8, alignItems: "center" },
  closeButtonText: { color: "#fff", fontWeight: "bold" },
});

export default MealPlanList;
