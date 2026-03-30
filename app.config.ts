import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "reset-app",
  slug: "reset-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.betterwell.reset.dev",
    // usesAppleSignIn: true, // TODO: re-enable once added to paid dev team
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSMicrophoneUsageDescription:
        "Reset uses your microphone for voice conversations with Ester.",
    },
  },
  android: {
    minSdkVersion: 26,
    package: "com.betterwell.reset.dev",
    permissions: ["RECORD_AUDIO"],
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-font",
    // "expo-apple-authentication", // TODO: re-enable once added to paid dev team
    [
      "expo-camera",
      {
        cameraPermission:
          "Reset uses your camera to read biometric signals from your face.",
      },
    ],
  ],
  extra: {
    shenAiApiKey: process.env.SHEN_AI_API_KEY ?? "",
    apiBaseUrl: process.env.API_BASE_URL ?? "",
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID ?? "",
    eas: {
      projectId: "e1576fd6-3519-4c0f-95e8-abf43df86a02",
    },
  },
});
