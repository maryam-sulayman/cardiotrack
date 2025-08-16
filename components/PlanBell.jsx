// components/PlanBell.jsx
import { cancelPlanReminders, scheduleWeeklyPlan } from '@/utils/planNotifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';

const PURPLE = '#6A0DAD';
const SUBTLE = '#F4F2FA';
const BORDER = '#E8E3F3';
const TEXT_DARK = '#1F1133';

export default function PlanBell({ weeklyPlan = [] }) {
  const sheetRef = useRef(null);
  const [nudge, setNudge] = useState(true);

  // count how many lines include a time like "22:15" or "7:30 pm"
  const timedCount = useMemo(() => {
    const r24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;
    const r12 = /\b(1[0-2]|0?\d):([0-5]\d)\s*(am|pm)\b/i;
    return Array.isArray(weeklyPlan)
      ? weeklyPlan.filter(s => r24.test(s) || r12.test(s)).length
      : 0;
  }, [weeklyPlan]);

  const themeTimes = {
    'Movement': '19:30',
    'Nutrition': '16:00',
    'Sleep': '22:15',
    'Stress': '10:00',
    'Strength/Balance': '08:30',
    'Social/Outdoors': '19:00',
    'Prep/Check-in': '20:00',
  };

  const disabled = !Array.isArray(weeklyPlan) || weeklyPlan.length !== 7;

  const scheduleExplicit = async () => {
    if (disabled) return;
    await scheduleWeeklyPlan(weeklyPlan, { requireTime: true, nudgeTime: nudge ? '21:00' : null });
    sheetRef.current?.hide();
  };
  const scheduleDefaults = async () => {
    if (disabled) return;
    await scheduleWeeklyPlan(weeklyPlan, { requireTime: false, themeTimes, nudgeTime: nudge ? '21:00' : null });
    sheetRef.current?.hide();
  };
  const cancelAll = async () => {
    await cancelPlanReminders();
    sheetRef.current?.hide();
  };

  const Action = ({ onPress, icon, color = PURPLE, title, subtitle, danger }) => (
    <Pressable
      onPress={onPress}
      disabled={danger ? false : disabled}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: danger ? '#FFF1F2' : SUBTLE,
        borderWidth: 1,
        borderColor: danger ? '#FECACA' : BORDER,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 36, height: 36, borderRadius: 10,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: danger ? '#FFE4E6' : '#EDE7F6',
          marginRight: 12,
        }}
      >
        <MaterialCommunityIcons name={icon} size={20} color={danger ? '#EF4444' : color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: TEXT_DARK, fontWeight: '800' }}>{title}</Text>
        {!!subtitle && (
          <Text style={{ color: '#6B6B6B', marginTop: 2, fontSize: 12 }}>{subtitle}</Text>
        )}
      </View>
      {!danger && (
        <MaterialCommunityIcons name="chevron-right" size={20} color={PURPLE} />
      )}
    </Pressable>
  );

  return (
    <>
      {/* Bell button in header */}
      <Pressable onPress={() => sheetRef.current?.show()} hitSlop={10} style={{ padding: 6 }}>
        <MaterialCommunityIcons name="bell" size={26} color="#F59E0B" />
        <View style={{ position:'absolute', top:4, right:4, width:8, height:8, borderRadius:4, backgroundColor:'#10B981' }} />
      </Pressable>

      {/* Bottom sheet */}
      <ActionSheet ref={sheetRef} containerStyle={{ padding: 16 }}>
        <Text style={{ fontWeight: '900', fontSize: 16, color: TEXT_DARK }}>Plan reminders</Text>
        <Text style={{ color: '#6B6B6B', marginTop: 4, marginBottom: 12 }}>
          Choose how you want reminders for this week’s plan.
        </Text>

        {/* Nudge toggle */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: SUBTLE,
            borderColor: BORDER,
            borderWidth: 1,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 12,
          }}
        >
          <View>
            <Text style={{ fontWeight: '800', color: TEXT_DARK }}>Daily reminder at 21:00</Text>
            <Text style={{ color: '#6B6B6B', fontSize: 12, marginTop: 2 }}>
              Sends a gentle reminder if you haven’t completed today.
            </Text>
          </View>
          <Switch value={nudge} onValueChange={setNudge} />
        </View>

        {/* Pretty action buttons */}
        <Action
          onPress={scheduleExplicit}
          icon="clock-outline"
          title="Schedule timed days"
          subtitle={
            disabled
              ? 'Generate a plan to enable scheduling.'
              : timedCount > 0
              ? `Schedules ${timedCount} day${timedCount > 1 ? 's' : ''} that include a time (e.g., 22:15).`
              : 'No times detected in your plan.'
          }
        />

        <Action
          onPress={scheduleDefaults}
          icon="calendar-check"
          title="Schedule all 7 with suggested times"
          subtitle="Adds times to days that don’t have one (e.g., Sleep 22:15, Movement 19:30)."
        />

        <Action
          onPress={cancelAll}
          icon="bell-off-outline"
          title="Cancel all plan reminders"
          subtitle="Stop notifications for this plan."
          danger
        />
      </ActionSheet>
    </>
  );
}
