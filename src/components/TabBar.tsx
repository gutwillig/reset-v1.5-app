import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { K } from "../constants/colors";
import { typography, spacing } from "../constants/typography";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: "🏠", inactive: "🏠" },
  Profile: { active: "👤", inactive: "👤" },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icons = TAB_ICONS[route.name] || { active: "●", inactive: "○" };
        const icon = isFocused ? icons.active : icons.inactive;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={typeof label === "string" ? label : route.name}
          >
            <View style={[styles.iconContainer, isFocused && styles.iconContainerFocused]}>
              <Text style={[styles.icon, isFocused && styles.iconFocused]}>{icon}</Text>
            </View>
            <Text style={[styles.label, isFocused && styles.labelFocused]}>
              {typeof label === "string" ? label : route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: K.white,
    borderTopWidth: 1,
    borderTopColor: K.border,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  iconContainerFocused: {
    backgroundColor: K.bone,
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconFocused: {
    opacity: 1,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    color: K.faded,
  },
  labelFocused: {
    color: K.brown,
    fontWeight: "600",
  },
});
