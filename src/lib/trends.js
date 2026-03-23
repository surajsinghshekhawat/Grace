/**
 * Rolling-window trends for assessments (newest-first API order).
 * Copy for UI: use trend *I18nSpec + dictionaries (see ElderProgress).
 */
import { depressionWellbeingScore, qolScoreOutOf10 } from "./wellbeing";

const DAY_MS = 24 * 60 * 60 * 1000;

export function filterCheckInsWithinDays(checkIns, days = 14) {
  if (!Array.isArray(checkIns) || !checkIns.length) return [];
  const cutoff = Date.now() - days * DAY_MS;
  return checkIns.filter((c) => {
    const t = new Date(c.created_at).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
}

/** @param {Array<{ created_at: string }>} assessments newest first */
export function filterAssessmentsWithinDays(assessments, days = 28) {
  if (!Array.isArray(assessments) || !assessments.length) return [];
  const cutoff = Date.now() - days * DAY_MS;
  return assessments.filter((a) => {
    const t = new Date(a.created_at).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
}

/** Oldest → newest for charts */
export function chronological(assessments) {
  return [...assessments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

/** @returns {{ direction: string, summaryKey: string|null, detailKey: string, params: Record<string, string|number> }} */
export function qolTrendI18nSpec(orderedOldestFirst) {
  const scores = orderedOldestFirst.map((a) => qolScoreOutOf10(a)).filter((v) => v != null);
  if (scores.length < 2) {
    return {
      direction: "unclear",
      summaryKey: null,
      detailKey: "prog.trend.qol.sparse",
      params: {},
    };
  }
  const first = scores[0];
  const last = scores[scores.length - 1];
  const delta = last - first;
  const n = scores.length;
  if (Math.abs(delta) < 0.35) {
    return {
      direction: "steady",
      summaryKey: "prog.trend.qol.steadySum",
      detailKey: "prog.trend.qol.steadyDet",
      params: { n },
    };
  }
  if (delta > 0) {
    return {
      direction: "up",
      summaryKey: "prog.trend.qol.upSum",
      detailKey: "prog.trend.qol.upDet",
      params: { delta: delta.toFixed(1), n },
    };
  }
  return {
    direction: "down",
    summaryKey: "prog.trend.qol.downSum",
    detailKey: "prog.trend.qol.downDet",
    params: { delta: Math.abs(delta).toFixed(1), n },
  };
}

/** @returns {{ direction: string, summaryKey: string|null, detailKey: string, params: Record<string, string|number> }} */
export function mentalTrendI18nSpec(orderedOldestFirst) {
  const scores = orderedOldestFirst.map((a) => depressionWellbeingScore(a)).filter((v) => v != null);
  if (scores.length < 2) {
    return {
      direction: "unclear",
      summaryKey: null,
      detailKey: "prog.trend.mental.sparse",
      params: {},
    };
  }
  const first = scores[0];
  const last = scores[scores.length - 1];
  const delta = last - first;
  const n = scores.length;
  const dRounded = Math.round(delta);
  if (Math.abs(delta) < 5) {
    return {
      direction: "steady",
      summaryKey: "prog.trend.mental.steadySum",
      detailKey: "prog.trend.mental.steadyDet",
      params: { n },
    };
  }
  if (delta > 0) {
    return {
      direction: "up",
      summaryKey: "prog.trend.mental.upSum",
      detailKey: "prog.trend.mental.upDet",
      params: { delta: dRounded, n },
    };
  }
  return {
    direction: "down",
    summaryKey: "prog.trend.mental.downSum",
    detailKey: "prog.trend.mental.downDet",
    params: { delta: Math.abs(dRounded), n },
  };
}

/** Daily check-ins: mood 1–5, oldest first */
export function checkinMoodTrendI18nSpec(checkInsOldestFirst) {
  const moods = checkInsOldestFirst.map((c) => c.mood).filter((v) => typeof v === "number");
  if (moods.length < 5) {
    return {
      direction: "unclear",
      summaryKey: null,
      detailKey: "prog.trend.mood.sparse",
      params: {},
    };
  }
  const mid = Math.floor(moods.length / 2);
  const firstAvg = moods.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondAvg = moods.slice(mid).reduce((a, b) => a + b, 0) / (moods.length - mid);
  const diff = secondAvg - firstAvg;
  const n = moods.length;
  if (Math.abs(diff) < 0.35) {
    return {
      direction: "steady",
      summaryKey: "prog.trend.mood.steadySum",
      detailKey: "prog.trend.mood.steadyDet",
      params: { n },
    };
  }
  if (diff > 0) {
    return {
      direction: "up",
      summaryKey: "prog.trend.mood.upSum",
      detailKey: "prog.trend.mood.upDet",
      params: { n },
    };
  }
  return {
    direction: "down",
    summaryKey: "prog.trend.mood.downSum",
    detailKey: "prog.trend.mood.downDet",
    params: { n },
  };
}
