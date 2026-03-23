import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const defaultState = {
  userName: "",
  userType: "",
  answers: {},
  currentQuestionIndex: 0,
  prediction: null,
  /** Optional Bearer for tools/tests; session uses httpOnly cookie. */
  authToken: null,
  authUser: null,
};

/**
 * Auth: httpOnly cookie + persisted authUser for UI (validated on hydrate via /api/me).
 * Assessment answers stay in memory only.
 */
const useStore = create(
  persist(
    (set) => ({
      ...defaultState,

      setUserName: (name) => set({ userName: name }),
      setUserType: (type) => set({ userType: type }),
      setAnswer: (questionId, answer) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
        })),
      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      setPrediction: (prediction) => set({ prediction }),
      clearPrediction: () => set({ prediction: null }),
      resetAssessment: () =>
        set({
          answers: {},
          currentQuestionIndex: 0,
          prediction: null,
        }),
      setAuthToken: (authToken) => set({ authToken }),
      setAuthUser: (authUser) => set({ authUser }),
      logout: () => set({ authToken: null, authUser: null }),
      resetStore: () => set({ ...defaultState }),
    }),
    {
      name: "grace-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        authUser: state.authUser,
      }),
      version: 2,
      migrate: (persisted) => ({
        authUser: persisted?.authUser ?? null,
        authToken: null,
      }),
    }
  )
);

export default useStore;
