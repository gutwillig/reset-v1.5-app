import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppOpenGreetingScreen } from "../screens/appOpen/AppOpenGreetingScreen";
import { DataGateScreen } from "../screens/appOpen/DataGateScreen";
import { NextMealScreen } from "../screens/appOpen/NextMealScreen";
import { AppOpenSurveyScreen } from "../screens/appOpen/AppOpenSurveyScreen";

export type AppOpenStackParamList = {
  Greeting: undefined;
  DataGate: { debugForceShow?: boolean } | undefined;
  Survey: undefined;
  NextMeal: undefined;
};

const Stack = createNativeStackNavigator<AppOpenStackParamList>();

export function AppOpenNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="Greeting" component={AppOpenGreetingScreen} />
      <Stack.Screen name="DataGate" component={DataGateScreen} />
      <Stack.Screen name="Survey" component={AppOpenSurveyScreen} />
      <Stack.Screen name="NextMeal" component={NextMealScreen} />
    </Stack.Navigator>
  );
}
