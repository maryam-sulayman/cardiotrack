// components/PlanList.js
import { getHabitIcon, splitPlanLine } from '@/utils/planText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CARD_WIDTH = 320;
const CARD_GAP = 16; // matches styles.planCard.marginRight
const SNAP = CARD_WIDTH + CARD_GAP;

const PlanList = ({ weeklyPlan, completion, toggleCompletion, streakCount }) => {
  const router = useRouter();

  const currentDayIndex = useMemo(() => {
    if (!Array.isArray(completion) || completion.length === 0) return 0;
    const firstIncomplete = completion.findIndex((d) => !d);
    return firstIncomplete === -1 ? completion.length - 1 : firstIncomplete;
  }, [completion]);

  const [activeIndex, setActiveIndex] = useState(currentDayIndex);

  const onMomentumScrollEnd = (e /** @type {NativeSyntheticEvent<NativeScrollEvent>} */) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SNAP);
    setActiveIndex(idx);
  };

  const indexRef = useRef(0);
  const handleScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SNAP);
    if (idx !== indexRef.current) {
      indexRef.current = idx;
      setActiveIndex(idx);
    }
  };
   const hasStreak = streakCount > 0;

  return (
    <View style={{ paddingTop: 30 }}>
      <Text style={styles.sectionTitle}>Your 7-Day Heart Plan  <MaterialCommunityIcons
                          name="calendar-heart"
                          size={23}
                          color={'#470775ff'}
                        /></Text>

      <View style={styles.planHeaderRow}>
        {/* Streak pill */}

<LinearGradient
  colors={hasStreak ? ['#FF7A59', '#FF5722'] : ['#FFE6DE', '#FFD6CC']} // softer orange when 0
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={[styles.streakPill, !hasStreak && { opacity: 0.8 }]} // or 0.6 if you want it lighter
>
  <MaterialCommunityIcons
    name="fire"
    size={14}
    color={hasStreak ? '#fff' : '#FF7A59'}
  />
  <Text style={[styles.streakPillText, !hasStreak && { color: '#FF7A59' }]}>
    {hasStreak ? `${streakCount}-Day Streak` : 'Start your streak'}
    {/* or use '0-Day Streak' if you prefer */}
  </Text>
</LinearGradient>


        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/plan')}>
          <Text style={styles.linkText}>View Full Plan</Text>
        </TouchableOpacity>
      </View>

      {/* —— Only cards here —— */}
      <FlatList
        data={weeklyPlan}
        horizontal
        keyExtractor={(_, index) => String(index)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
        snapToInterval={SNAP}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToAlignment="start"
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item, index }) => {
  const { day, theme, body } = splitPlanLine(item);
  const isDone = completion[index];

  return (
    <View style={styles.planCard}>
      <View style={styles.row}>
        <View style={styles.iconShadow}>
          <LinearGradient colors={['#963EE8', '#6A0DAD']} style={styles.iconGradient}>
            <MaterialCommunityIcons name={getHabitIcon(theme)} size={24} color="#fff" />
          </LinearGradient>
        </View>

        {/* <-- content column */}
        <View style={styles.content}>
            <Text style={styles.planDay}>Day {day || index + 1} </Text>
          
          <Text style={styles.planTitle} numberOfLines={6}>
            {body}
          </Text>
        </View>
      </View>

              {/* Action button */}
              <TouchableOpacity onPress={() => toggleCompletion(index)} activeOpacity={0.85}>
                {isDone ? (
                  <LinearGradient colors={['#34D399', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.actionBox, styles.actionBoxGradient]}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                    <Text style={[styles.actionText, styles.actionTextDone]}>Completed 🎉</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.actionBox, styles.actionBoxPending]}>
                    <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={16} color="#6A0DAD" />
                    <Text style={styles.actionText}>Mark as Complete ✔️</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* —— One dot row outside the list —— */}
      <View style={styles.progressDots}>
        {(weeklyPlan?.length ? weeklyPlan : Array.from({ length: 7 })).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === activeIndex ? styles.dotActive : null
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  /* Streak pill */
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  streakPillText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  linkButton: { paddingHorizontal: 8 },
  linkText: { color: '#6B21A8', fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
 planCard: {
    backgroundColor: '#F8F1FF',
    borderRadius: 20,
    paddingHorizontal: 20,
  paddingVertical: 30,
    marginRight: CARD_GAP,
    width: CARD_WIDTH,
    minHeight: 250,
    justifyContent: 'space-between',
    overflow: 'hidden',        
  },
   row: {                        
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  content: {                     // <- key: constrain text column
    flex: 1,
    minWidth: 0,
  },

  planDay: { fontSize: 13, color: '#6B6B6B', fontWeight: '600', marginBottom: 4 },
  themeHeading: {                // sits next to Day, shrinks if long
    marginLeft: 4,
    color: '#0da0adff',
    fontWeight: '700',
    fontSize: 14,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },

  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1230',
    lineHeight: 22,
    flexShrink: 1,
    minWidth: 0,
  },

  iconShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderRadius: 25,
  },
  iconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBox: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignSelf: 'center',
    width: 260,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBoxPending: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E4D6FF',
  },
  actionBoxGradient: {
    borderWidth: 0,
  },
  actionText: { fontSize: 14, color: '#6A0DAD', fontWeight: '700', textAlign: 'center' },
  actionTextDone: { color: '#fff' },

  progressDots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#E3DAF7',
    borderWidth: 1,
    borderColor: '#D2C6F2',
  },
  dotActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
    width: 10,
    height: 10,
  },
});

export default PlanList;
