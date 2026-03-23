const STORAGE_KEY = "grace_assessment_onboarding_v1";

/** Route elders should open for “start assessment” (onboarding once per device, then assessment). */
export function getAssessmentEntryPath() {
  if (typeof window === "undefined") return "/elder/assessment";
  try {
    if (!window.localStorage.getItem(STORAGE_KEY)) return "/elder/assessment/onboarding";
  } catch {
    /* private mode */
  }
  return "/elder/assessment";
}

export function markAssessmentOnboardingDone() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}
