/** QoL on 0–10 scale consistent with backend `qol_score_0_100` (0–100). */
export function qolScoreOutOf10(assessment) {
  if (!assessment || typeof assessment.qol_score_0_100 !== "number") return null;
  return Math.round((assessment.qol_score_0_100 / 10) * 10) / 10;
}

export function qolPercentForBar(assessment) {
  if (!assessment || typeof assessment.qol_score_0_100 !== "number") return 0;
  return Math.min(100, Math.max(0, assessment.qol_score_0_100));
}

export function depressionWellbeingScore(assessment) {
  if (!assessment || typeof assessment.depression_probability !== "number") return null;
  return Math.round((1 - assessment.depression_probability) * 100);
}

export function moodEnergySleepLabels() {
  return {
    1: "Low",
    2: "Below average",
    3: "OK",
    4: "Good",
    5: "Great",
  };
}
