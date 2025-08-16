import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STORAGE_KEY = 'planNotificationIds'; // { [dayIndex]: { primary?: string, nudge?: string } }

export async function initPlanNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

// --- parsing helpers ---
function parseTime(line) {
  const m24 = line.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m24) return { hour: +m24[1], minute: +m24[2] };
  const m12 = line.match(/\b(1[0-2]|0?\d):([0-5]\d)\s*(am|pm)\b/i);
  if (m12) {
    let h = +m12[1], min = +m12[2];
    const ampm = m12[3].toLowerCase();
    if (ampm === 'pm' && h !== 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return { hour: h, minute: min };
  }
  return null;
}
function themeFromLine(line) {
  const m = line.match(/^Day\s*\d+:\s*([^—:\-]+)\s*[—:\-]/i);
  return m ? m[1].trim() : null;
}
function dateForOffset(dayOffset, hour, minute) {
  const d = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Cancel all our stored notifications
export async function cancelPlanReminders() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved) {
    const map = JSON.parse(saved);
    const ids = Object.values(map).flatMap(v => [v.primary, v.nudge].filter(Boolean));
    await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

// Cancel just the nudge for a specific day (call this when day is marked complete)
export async function cancelNudgeForDay(dayIndex) {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  const map = JSON.parse(saved);
  const entry = map[dayIndex];
  if (entry?.nudge) {
    await Notifications.cancelScheduledNotificationAsync(entry.nudge).catch(() => {});
    map[dayIndex].nudge = null;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }
}

/**
 * Schedule reminders for a 7-day plan.
 * Options:
 *  - requireTime: true => only schedule primary reminders when a time is present in the text.
 *  - themeTimes: optional map for default times when requireTime=false (e.g., { "Sleep": "22:15" }).
 *  - nudgeTime: optional "HH:MM" (e.g., "21:00"). If set, schedule a same-day nudge for every day.
 */
export async function scheduleWeeklyPlan(planItems, opts = {}) {
  const {
    requireTime = true,
    themeTimes = null,
    nudgeTime = null,
  } = opts;

  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Notification permission not granted');

  // clear previous plan notifications only
  await cancelPlanReminders();

  const idMap = {};

  for (let i = 0; i < planItems.length; i++) {
    const line = planItems[i];
    const body = line.replace(/^Day\s*\d+:\s*/i, '').trim();

    // Primary reminder time
    let chosen = parseTime(line);
    if (!chosen && !requireTime && themeTimes) {
      const theme = themeFromLine(line);
      const t = theme ? themeTimes[theme] : null; // "HH:MM"
      if (t) {
        const [h, m] = t.split(':').map(Number);
        chosen = { hour: h, minute: m };
      }
    }

    // Schedule primary if we have a time
    if (chosen) {
      const date = dateForOffset(i, chosen.hour, chosen.minute);
      if (i === 0 && date.getTime() < Date.now()) {
        const soon = new Date(Date.now() + 5 * 60 * 1000);
        date.setHours(soon.getHours(), soon.getMinutes(), 0, 0);
      }
      const primaryId = await Notifications.scheduleNotificationAsync({
        content: { title: `Day ${i + 1}`, body, sound: true },
        trigger: date,
      });
      idMap[i] = { primary: primaryId };
    } else {
      idMap[i] = {};
    }

    // Optional nudge (e.g., 21:00 same day) — we’ll cancel this when user completes the day
    if (nudgeTime) {
      const [nh, nm] = nudgeTime.split(':').map(Number);
      const nudgeDate = dateForOffset(i, nh, nm);
      const nudgeId = await Notifications.scheduleNotificationAsync({
        content: { title: `Day ${i + 1} — don’t forget`, body: 'Mark today’s task as done if you’ve completed it.', sound: true },
        trigger: nudgeDate,
      });
      idMap[i].nudge = nudgeId;
    }
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(idMap));
  return idMap;
}
