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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { K } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { Button } from "../../components";
import { useApp } from "../../context/AppContext";
import { loginWithEmail, loginWithApple } from "../../services/auth";

export function LoginScreen() {
  const { setAuth, resetState } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === "ios");

  React.useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const isValid = email.includes("@") && password.length >= 1;

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      setAuth(user);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("No identity token from Apple");
      }

      const user = await loginWithApple(credential.identityToken);
      setAuth(user);
    } catch (err: any) {
      if (err.code === "ERR_REQUEST_CANCELED") return;
      setError(err.message || "Apple sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    resetState();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to pick up where you left off.
          </Text>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

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
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={K.faded}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <Button
              title={isLoading ? "Signing in..." : "Sign in"}
              onPress={handleLogin}
              disabled={!isValid || isLoading}
            />

            {appleAvailable && (
              <>
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.appleButton, isLoading && styles.appleButtonDisabled]}
                  onPress={handleAppleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={K.white} />
                  ) : (
                    <>
                      <Text style={styles.appleIcon}></Text>
                      <Text style={styles.appleText}>Sign in with Apple</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.startOverButton}
            onPress={handleStartOver}
            disabled={isLoading}
          >
            <Text style={styles.startOverText}>Start over</Text>
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
  title: {
    ...typography.h1,
    color: K.text,
    marginTop: 40,
  },
  subtitle: {
    ...typography.body,
    color: K.sub,
    marginTop: 8,
  },
  form: {
    marginTop: 32,
    gap: 16,
  },
  errorContainer: {
    backgroundColor: "#FDF2F2",
    borderWidth: 1,
    borderColor: K.err,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    ...typography.bodySmall,
    color: K.err,
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
  appleButtonDisabled: {
    opacity: 0.6,
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
  startOverButton: {
    padding: 8,
  },
  startOverText: {
    fontSize: 14,
    color: K.faded,
  },
});
