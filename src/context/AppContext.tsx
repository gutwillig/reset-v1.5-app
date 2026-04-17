import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { AppState as RNAppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MetabolicType } from "../constants/colors";
import { getTokens, clearTokens } from "../services/apiClient";
import { fetchMe, AuthUser } from "../services/auth";
import { getProfile } from "../services/profile";
import * as BrazeService from "../services/braze";
import { requestPushPermission } from "../services/pushNotifications";
import { notifyAppOpened } from "../services/notifications";

// State types
interface UserProfile {
  email?: string;
  name?: string;
  metabolicType?: MetabolicType;
  goal?: string;
  quizAnswers: Record<string, string>;
  tastePreferences: string[];
  dietaryRestrictions: string[];
  hasCompletedOnboarding: boolean;
}

interface ScanResultsRaw {
  heartRate: number;
  stressIndex: number | null;
  hrvSdnn: number | null;
  hrvLnrmssd: number | null;
  breathingRate: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  parasympatheticActivity: number | null;
  cardiacWorkload: number | null;
  ageEstimate: number | null;
  signalQuality: number;
}

interface BiometricData {
  stressIndex: number;
  heartRate: number;
  wellness: number;
  vascularAge: number;
  raw?: ScanResultsRaw;
}

interface AuthState {
  isAuthenticated: boolean;
  authUser: AuthUser | null;
}

interface AppState {
  user: UserProfile;
  biometrics: BiometricData | null;
  auth: AuthState;
  isLoading: boolean;
}

// Action types
type AppAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOAD_STATE"; payload: Omit<AppState, "auth" | "isLoading"> }
  | { type: "SET_QUIZ_ANSWER"; payload: { questionId: string; answer: string } }
  | { type: "SET_METABOLIC_TYPE"; payload: MetabolicType }
  | { type: "SET_GOAL"; payload: string }
  | { type: "SET_BIOMETRICS"; payload: BiometricData }
  | { type: "SET_TASTE_PREFERENCES"; payload: string[] }
  | { type: "SET_DIETARY_RESTRICTIONS"; payload: string[] }
  | { type: "SET_USER_ACCOUNT"; payload: { email: string; name?: string } }
  | { type: "SET_AUTH"; payload: AuthState }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "RESET_STATE" };

// Initial state
const initialState: AppState = {
  user: {
    quizAnswers: {},
    tastePreferences: [],
    dietaryRestrictions: [],
    hasCompletedOnboarding: false,
  },
  biometrics: null,
  auth: { isAuthenticated: false, authUser: null },
  isLoading: true,
};

// Storage key
const STORAGE_KEY = "@reset_app_state";

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "LOAD_STATE":
      return {
        ...state,
        user: action.payload.user,
        biometrics: action.payload.biometrics,
        isLoading: false,
      };

    case "SET_QUIZ_ANSWER":
      return {
        ...state,
        user: {
          ...state.user,
          quizAnswers: {
            ...state.user.quizAnswers,
            [action.payload.questionId]: action.payload.answer,
          },
        },
      };

    case "SET_METABOLIC_TYPE":
      return {
        ...state,
        user: {
          ...state.user,
          metabolicType: action.payload,
        },
      };

    case "SET_GOAL":
      return {
        ...state,
        user: {
          ...state.user,
          goal: action.payload,
        },
      };

    case "SET_BIOMETRICS":
      return {
        ...state,
        biometrics: action.payload,
      };

    case "SET_TASTE_PREFERENCES":
      return {
        ...state,
        user: {
          ...state.user,
          tastePreferences: action.payload,
        },
      };

    case "SET_DIETARY_RESTRICTIONS":
      return {
        ...state,
        user: {
          ...state.user,
          dietaryRestrictions: action.payload,
        },
      };

    case "SET_USER_ACCOUNT":
      return {
        ...state,
        user: {
          ...state.user,
          email: action.payload.email,
          name: action.payload.name,
        },
      };

    case "SET_AUTH":
      return {
        ...state,
        auth: action.payload,
      };

    case "COMPLETE_ONBOARDING":
      return {
        ...state,
        user: {
          ...state.user,
          hasCompletedOnboarding: true,
        },
      };

    case "RESET_STATE":
      return { ...initialState, isLoading: false };

    default:
      return state;
  }
}

// Context
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setQuizAnswer: (questionId: string, answer: string) => void;
  setMetabolicType: (type: MetabolicType) => void;
  setGoal: (goal: string) => void;
  setBiometrics: (data: BiometricData) => void;
  setTastePreferences: (preferences: string[]) => void;
  setDietaryRestrictions: (restrictions: string[]) => void;
  setUserAccount: (email: string, name?: string) => void;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
  completeOnboarding: () => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load saved state on mount
  useEffect(() => {
    loadState();
  }, []);

  // Save state on change (exclude auth — derived from tokens)
  useEffect(() => {
    if (!state.isLoading) {
      saveState(state);
    }
  }, [state]);

  // Tell backend whenever the app opens / returns to foreground so it can
  // cancel any pending re-engagement pushes (PRD §19.2 Action Paths).
  useEffect(() => {
    if (!state.auth.isAuthenticated) return;

    notifyAppOpened();

    const sub = RNAppState.addEventListener("change", (status) => {
      if (status === "active") {
        notifyAppOpened();
      }
    });
    return () => sub.remove();
  }, [state.auth.isAuthenticated]);

  async function loadState() {
    try {
      // Load persisted app state
      const savedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        dispatch({ type: "LOAD_STATE", payload: parsed });
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }

      // Check if user has a valid session
      const { accessToken } = await getTokens();
      if (accessToken) {
        try {
          const authUser = await fetchMe();
          dispatch({
            type: "SET_AUTH",
            payload: { isAuthenticated: true, authUser },
          });

          // Re-identify with Braze on session restore + register push token
          BrazeService.changeUser(authUser.id);
          requestPushPermission();

          // If local state is missing onboarding data but backend has it (e.g. reinstall),
          // restore from backend profile
          const savedParsed = savedState ? JSON.parse(savedState) : null;
          const localHasOnboarding = savedParsed?.user?.hasCompletedOnboarding;
          if (!localHasOnboarding) {
            try {
              const profile = await getProfile();
              if (profile.layer1.primaryBucket) {
                dispatch({
                  type: "SET_METABOLIC_TYPE",
                  payload: profile.layer1.primaryBucket as MetabolicType,
                });
                if (profile.layer1.tasteCluster) {
                  dispatch({
                    type: "SET_TASTE_PREFERENCES",
                    payload: [profile.layer1.tasteCluster],
                  });
                }
                if (profile.layer1.dietaryRestrictions.length > 0) {
                  dispatch({
                    type: "SET_DIETARY_RESTRICTIONS",
                    payload: profile.layer1.dietaryRestrictions,
                  });
                }
                if (profile.layer1.goal) {
                  dispatch({
                    type: "SET_GOAL",
                    payload: profile.layer1.goal,
                  });
                }
                dispatch({ type: "COMPLETE_ONBOARDING" });
              }
            } catch {
              // Profile fetch failed — continue with local state
            }
          }
        } catch {
          // Token invalid/expired and refresh failed
          await clearTokens();
        }
      }
    } catch (error) {
      console.error("Failed to load state:", error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  async function saveState(stateToSave: AppState) {
    try {
      // Only persist user profile and biometrics, not auth
      const { user, biometrics } = stateToSave;
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, biometrics }),
      );
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  // Helper functions
  const setQuizAnswer = (questionId: string, answer: string) => {
    dispatch({ type: "SET_QUIZ_ANSWER", payload: { questionId, answer } });
  };

  const setMetabolicType = (type: MetabolicType) => {
    dispatch({ type: "SET_METABOLIC_TYPE", payload: type });
  };

  const setGoal = (goal: string) => {
    dispatch({ type: "SET_GOAL", payload: goal });
  };

  const setBiometrics = (data: BiometricData) => {
    dispatch({ type: "SET_BIOMETRICS", payload: data });
  };

  const setTastePreferences = (preferences: string[]) => {
    dispatch({ type: "SET_TASTE_PREFERENCES", payload: preferences });
  };

  const setDietaryRestrictions = (restrictions: string[]) => {
    dispatch({ type: "SET_DIETARY_RESTRICTIONS", payload: restrictions });
  };

  const setUserAccount = (email: string, name?: string) => {
    dispatch({ type: "SET_USER_ACCOUNT", payload: { email, name } });
  };

  const setAuth = (user: AuthUser) => {
    dispatch({
      type: "SET_AUTH",
      payload: { isAuthenticated: true, authUser: user },
    });
    // Identify user with Braze and request push permission
    BrazeService.changeUser(user.id);
    requestPushPermission();
  };

  const clearAuth = () => {
    dispatch({
      type: "SET_AUTH",
      payload: { isAuthenticated: false, authUser: null },
    });
  };

  const completeOnboarding = () => {
    dispatch({ type: "COMPLETE_ONBOARDING" });
  };

  const resetState = () => {
    dispatch({ type: "RESET_STATE" });
    AsyncStorage.removeItem(STORAGE_KEY);
    clearTokens();
  };

  const value: AppContextValue = {
    state,
    dispatch,
    setQuizAnswer,
    setMetabolicType,
    setGoal,
    setBiometrics,
    setTastePreferences,
    setDietaryRestrictions,
    setUserAccount,
    setAuth,
    clearAuth,
    completeOnboarding,
    resetState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
