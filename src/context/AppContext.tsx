import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MetabolicType } from "../constants/colors";

// State types
interface UserProfile {
  email?: string;
  name?: string;
  metabolicType?: MetabolicType;
  quizAnswers: Record<string, string>;
  tastePreferences: string[];
  dietaryRestrictions: string[];
  hasCompletedOnboarding: boolean;
}

interface BiometricData {
  stressIndex: number;
  heartRate: number;
  wellness: number;
  vascularAge: number;
}

interface AppState {
  user: UserProfile;
  biometrics: BiometricData | null;
  isLoading: boolean;
}

// Action types
type AppAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "SET_QUIZ_ANSWER"; payload: { questionId: string; answer: string } }
  | { type: "SET_METABOLIC_TYPE"; payload: MetabolicType }
  | { type: "SET_BIOMETRICS"; payload: BiometricData }
  | { type: "SET_TASTE_PREFERENCES"; payload: string[] }
  | { type: "SET_DIETARY_RESTRICTIONS"; payload: string[] }
  | { type: "SET_USER_ACCOUNT"; payload: { email: string; name?: string } }
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
      return { ...action.payload, isLoading: false };

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
  // Helper functions
  setQuizAnswer: (questionId: string, answer: string) => void;
  setMetabolicType: (type: MetabolicType) => void;
  setBiometrics: (data: BiometricData) => void;
  setTastePreferences: (preferences: string[]) => void;
  setDietaryRestrictions: (restrictions: string[]) => void;
  setUserAccount: (email: string, name?: string) => void;
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

  // Save state on change
  useEffect(() => {
    if (!state.isLoading) {
      saveState(state);
    }
  }, [state]);

  async function loadState() {
    try {
      const savedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        dispatch({ type: "LOAD_STATE", payload: parsed });
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } catch (error) {
      console.error("Failed to load state:", error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  async function saveState(stateToSave: AppState) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
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

  const completeOnboarding = () => {
    dispatch({ type: "COMPLETE_ONBOARDING" });
  };

  const resetState = () => {
    dispatch({ type: "RESET_STATE" });
    AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value: AppContextValue = {
    state,
    dispatch,
    setQuizAnswer,
    setMetabolicType,
    setBiometrics,
    setTastePreferences,
    setDietaryRestrictions,
    setUserAccount,
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
