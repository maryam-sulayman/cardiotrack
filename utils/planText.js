// utils/planText.js

// Parse "Day 1: Movement — ..."
// -> { day: 1, theme: "Movement", body: "..." }
export function splitPlanLine(line = "") {
  let day = null, theme = "", body = String(line).trim();

  const m = body.match(/^Day\s*(\d+)\s*:\s*(.*)$/i);
  if (m) {
    day = Number(m[1]);
    body = m[2].trim();
  }

  const m2 = body.match(/^(.*?)\s*[—-]\s*(.*)$/); // em-dash or hyphen
  if (m2) {
    theme = m2[1].trim();
    body = m2[2].trim();
  }

  return { day, theme, body };
}

function themeKey(theme = "") {
  const t = String(theme).toLowerCase();
  if (t.startsWith("movement")) return "movement";
  if (t.startsWith("nutrition")) return "nutrition";
  if (t.startsWith("sleep")) return "sleep";
  if (t.startsWith("stress")) return "stress";
  if (t.startsWith("strength")) return "strength";
  if (t.startsWith("social")) return "social";
  if (t.startsWith("prep") || t.includes("check")) return "prep";
  return "other";
}

// Theme → MaterialCommunityIcons name
export function getHabitIcon(theme) {
  switch (themeKey(theme)) {
    case "movement":  return "walk";
    case "nutrition": return "food-apple";
    case "sleep":     return "sleep";
    case "stress":    return "meditation";
    case "strength":  return "dumbbell";
    case "social":    return "account-group"; // widely supported
    case "prep":      return "calendar-check";
    default:          return "heart";
  }
}

export function getIconGradient(theme) {
  switch (themeKey(theme)) {
    case "movement":  return ['#06B6D4', '#3B82F6'];      // teal → blue
    case "nutrition": return ['#A3E635', '#22C55E'];      // lime → green
    case "sleep":     return ['#6366F1', '#8B5CF6'];      // indigo → violet
    case "stress":    return ['#FCA5A5', '#FB923C'];      // soft red → orange (warm but calm)
    case "strength":  return ['#EF4444', '#7C3AED'];      // red → purple
    case "social":    return ['#EC4899', '#F43F5E'];      // pink → rose
    case "prep":      return ['#64748B', '#8B5CF6'];      // slate → violet
    default:          return ['#FF6FD8', '#3813C2'];      // aurora fallback
  }
}
// Optional default export so either import style works
export default { splitPlanLine, getHabitIcon, getIconGradient };
