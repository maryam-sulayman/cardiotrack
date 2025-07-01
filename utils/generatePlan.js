import recommendations from '@/assets/data/recommendations.json';

export function generatePlan(userProfile) {
  const plan = [];
  const usedTasks = new Set();

  // 1. Pull from riskLevel
  if (recommendations.riskLevel[userProfile.riskLevel]) {
    recommendations.riskLevel[userProfile.riskLevel].forEach((tip) => {
      if (plan.length < 7 && !usedTasks.has(tip.task)) {
        plan.push(tip.task);
        usedTasks.add(tip.task);
      }
    });
  }

  // 2. Pull from behavioural data
  const behaviours = recommendations.behaviours;

  if (userProfile.sleep < 6 && behaviours.sleep?.low) {
    behaviours.sleep.low.forEach((tip) => {
      if (plan.length < 7 && !usedTasks.has(tip.task)) {
        plan.push(tip.task);
        usedTasks.add(tip.task);
      }
    });
  }

  if (userProfile.stress > 7 && behaviours.stress?.high) {
    behaviours.stress.high.forEach((tip) => {
      if (plan.length < 7 && !usedTasks.has(tip.task)) {
        plan.push(tip.task);
        usedTasks.add(tip.task);
      }
    });
  }

  if (userProfile.smoking && behaviours.smoking?.true) {
    behaviours.smoking.true.forEach((tip) => {
      if (plan.length < 7 && !usedTasks.has(tip.task)) {
        plan.push(tip.task);
        usedTasks.add(tip.task);
      }
    });
  }

  // 3. Pull from demographics (optional)
  const demographicKey = `${userProfile.gender}_${userProfile.ethnicity}`;
  if (recommendations.demographics?.[demographicKey]) {
    recommendations.demographics[demographicKey].forEach((tip) => {
      if (plan.length < 7 && !usedTasks.has(tip.task)) {
        plan.push(tip.task);
        usedTasks.add(tip.task);
      }
    });
  }

  // 4. Fallback if fewer than 7
  while (plan.length < 7) {
    plan.push("Do something relaxing or enjoyable today.");
  }

  // 5. Format as Day 1–7
  const formattedPlan = plan.map((task, index) => `Day ${index + 1}: ${task}`);
  return formattedPlan;
}
