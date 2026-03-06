import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  QuizScreen,
  CameraPermScreen,
  ScanScreen,
  ScanRevealScreen,
  TypeRevealScreen,
  ShareScreen,
  TasteScreen,
  RestrictScreen,
  AccountScreen,
} from "../screens/onboarding";
import { K } from "../constants/colors";

export type OnboardingStackParamList = {
  Quiz: undefined;
  CameraPerm: undefined;
  Scan: undefined;
  ScanReveal: undefined;
  TypeReveal: undefined;
  Share: undefined;
  Taste: undefined;
  Restrict: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: K.cream },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="CameraPerm" component={CameraPermScreen} />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          animation: "fade",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ScanReveal"
        component={ScanRevealScreen}
        options={{ animation: "fade" }}
      />
      <Stack.Screen
        name="TypeReveal"
        component={TypeRevealScreen}
        options={{ animation: "fade" }}
      />
      <Stack.Screen name="Share" component={ShareScreen} />
      <Stack.Screen name="Taste" component={TasteScreen} />
      <Stack.Screen name="Restrict" component={RestrictScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
    </Stack.Navigator>
  );
}
