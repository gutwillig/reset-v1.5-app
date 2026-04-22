import React from "react";
import { Image, StyleSheet } from "react-native";

const sources = {
  ochre: require("../../../assets/images/mascot-ochre.png"),
  bone: require("../../../assets/images/mascot-bone.png"),
};

export type MascotVariant = keyof typeof sources;

interface MascotProps {
  size?: number;
  variant?: MascotVariant;
}

export function Mascot({ size = 120, variant = "ochre" }: MascotProps) {
  return (
    <Image
      source={sources[variant]}
      style={[styles.image, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {},
});
