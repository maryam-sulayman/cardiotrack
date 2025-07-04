export const generatePlan = ({ riskLevel, behaviours, demographicKey, days = 7 }) => {
  const basePlan = [];

  // Add behaviour recommendations
  if (behaviours.sleep === 'low') {
    basePlan.push({ task: 'Sleep 7–9 hours per night' });
  }
  if (behaviours.stress === 'high') {
    basePlan.push({ task: 'Take a 5-minute breathing break' });
  }
  if (behaviours.smoking === 'true') {
    basePlan.push({ task: 'Try to reduce smoking or switch to a lower-nicotine option' });
  }
  if (behaviours.hydration === 'low') {
    basePlan.push({ task: 'Drink at least 1.5–2L of water' });
  }
  if (behaviours.steps === 'low') {
    basePlan.push({ task: 'Aim for at least 5,000 steps' });
  }

  // Fallback if no recommendations triggered
  if (basePlan.length === 0) {
    basePlan.push({ task: 'Maintain your current healthy routine!' });
  }

  // Expand to 7 days
  const fullPlan = [];
  for (let i = 0; i < days; i++) {
    const item = basePlan[i % basePlan.length]; // cycle through if < 7
    fullPlan.push({ day: i + 1, task: item.task });
  }

  return fullPlan;
};
