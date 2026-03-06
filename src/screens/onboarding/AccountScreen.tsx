import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { K } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { EsterBubble, Button } from "../../components";
import { useApp } from "../../context/AppContext";

type Props = NativeStackScreenProps<any, "Account">;

export function AccountScreen({ navigation }: Props) {
  const { setUserAccount, completeOnboarding } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValid = email.includes("@") && password.length >= 6;

  const handleCreateAccount = () => {
    setUserAccount(email);
    completeOnboarding();
    // Navigation will be handled by RootNavigator
  };

  const handleAppleSignIn = () => {
    // Mock Apple Sign In
    setUserAccount("user@icloud.com", "User");
    completeOnboarding();
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <EsterBubble message="Save your profile so I don't lose what I just learned." />

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={K.faded}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={K.faded}
                secureTextEntry
              />
            </View>

            <Button
              title="Save profile"
              onPress={handleCreateAccount}
              disabled={!isValid}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.appleButton} onPress={handleAppleSignIn}>
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleText}>Sign in with Apple</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: K.cream,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 80,
  },
  form: {
    marginTop: 28,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    ...typography.label,
    color: K.sub,
  },
  input: {
    backgroundColor: K.white,
    borderWidth: 1,
    borderColor: K.border,
    borderRadius: 12,
    padding: 16,
    ...typography.body,
    color: K.text,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: K.border,
  },
  dividerText: {
    ...typography.bodySmall,
    color: K.faded,
    marginHorizontal: 16,
  },
  appleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: K.warmBlack,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  appleIcon: {
    color: K.white,
    fontSize: 20,
  },
  appleText: {
    ...typography.button,
    color: K.white,
  },
  bottom: {
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: K.faded,
  },
});
