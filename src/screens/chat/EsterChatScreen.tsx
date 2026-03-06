import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { K } from "../../constants/colors";
import { typography, spacing, radius } from "../../constants/typography";
import { Avatar } from "../../components";
import { useApp } from "../../context/AppContext";
import type { Meal } from "../../components";

type ChatRouteParams = {
  EsterChat: {
    context?: "general" | "meal";
    meal?: Meal;
  };
};

interface Message {
  id: string;
  text: string;
  sender: "user" | "ester";
  timestamp: Date;
}

// Ester's response generator (mock - would connect to backend)
function getEsterResponse(userMessage: string, context?: string, meal?: Meal): string {
  const lowerMessage = userMessage.toLowerCase();

  // Meal-specific context
  if (meal) {
    if (lowerMessage.includes("why") || lowerMessage.includes("explain")) {
      return `Great question about the ${meal.name}. ${meal.whyLine} This meal has ${meal.protein}g of protein which is key for your metabolic type.`;
    }
    if (lowerMessage.includes("substitute") || lowerMessage.includes("swap") || lowerMessage.includes("replace")) {
      return `I can suggest some alternatives to ${meal.name}. What are you looking to change — the protein, the prep time, or the overall flavor profile?`;
    }
    if (lowerMessage.includes("calories") || lowerMessage.includes("nutrition")) {
      return `${meal.name} has ${meal.calories} calories and ${meal.protein}g of protein. The macros are balanced for your type — designed to keep your energy steady.`;
    }
    return `Tell me more about what you're thinking regarding ${meal.name}. I can adjust timing, ingredients, or suggest something completely different.`;
  }

  // General responses
  if (lowerMessage.includes("hungry") || lowerMessage.includes("starving")) {
    return "I hear you. That hunger is real — it's your body asking for fuel. Let me check your meal timing. Have you eaten in the last 3-4 hours?";
  }
  if (lowerMessage.includes("tired") || lowerMessage.includes("exhausted") || lowerMessage.includes("energy")) {
    return "Low energy often signals a metabolic mismatch. When did you last eat, and what was it? That'll help me see if it's timing, fuel type, or something else.";
  }
  if (lowerMessage.includes("stress") || lowerMessage.includes("anxious") || lowerMessage.includes("overwhelmed")) {
    return "Stress directly impacts how your body processes food. Your cortisol levels affect hunger signals and energy. I'll adjust tonight's dinner to include more calming nutrients.";
  }
  if (lowerMessage.includes("craving") || lowerMessage.includes("want")) {
    return "Cravings are signals, not weaknesses. What are you craving? Sweet, salty, crunchy? That tells me what your body might actually need.";
  }
  if (lowerMessage.includes("weight") || lowerMessage.includes("lose") || lowerMessage.includes("gain")) {
    return "I don't focus on weight — I focus on how your body uses energy. When we get your metabolism stable, your body finds its balance naturally. What's driving this question?";
  }
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hey! I'm here. What's on your mind — food, energy, or something else?";
  }
  if (lowerMessage.includes("thank")) {
    return "Of course. That's what I'm here for. Anything else on your mind?";
  }

  // Default response
  return "Tell me more. The more context you give me, the better I can help tune your meals to what your body actually needs.";
}

export function EsterChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ChatRouteParams, "EsterChat">>();
  const { state } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);

  const context = route.params?.context || "general";
  const meal = route.params?.meal;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Initial greeting based on context
  useEffect(() => {
    const initialMessage: Message = {
      id: "initial",
      text: meal
        ? `Let's talk about ${meal.name}. What would you like to know — why I picked it, what you could swap, or something else?`
        : "I'm your physician in your pocket. Ask me anything about your meals, energy, or how you're feeling. I'm here to help.",
      sender: "ester",
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  }, [meal]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate Ester typing and responding
    setTimeout(() => {
      const response = getEsterResponse(inputText, context, meal);
      const esterMessage: Message = {
        id: `ester-${Date.now()}`,
        text: response,
        sender: "ester",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, esterMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Avatar size={36} state="neutral" />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Ester</Text>
            <Text style={styles.headerSubtitle}>Your physician in your pocket</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Meal context banner (if chatting about a specific meal) */}
      {meal && (
        <View style={styles.contextBanner}>
          <Text style={styles.contextLabel}>Discussing</Text>
          <Text style={styles.contextMeal}>{meal.name}</Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Ester anything..."
            placeholderTextColor={K.faded}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Message bubble component
function MessageBubble({ message }: { message: Message }) {
  const isEster = message.sender === "ester";

  return (
    <View style={[styles.messageBubbleContainer, isEster ? styles.esterContainer : styles.userContainer]}>
      {isEster && <Avatar size={32} state="neutral" />}
      <View style={[styles.messageBubble, isEster ? styles.esterBubble : styles.userBubble]}>
        <Text style={[styles.messageText, isEster ? styles.esterText : styles.userText]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

// Typing indicator
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingContainer}>
      <Avatar size={32} state="observing" />
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.typingDot,
              { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: K.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: K.border,
    backgroundColor: K.bone,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: K.white,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 24,
    color: K.brown,
    fontWeight: "300",
    marginTop: -2,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerInfo: {
    alignItems: "flex-start",
  },
  headerTitle: {
    ...typography.bodyMedium,
    color: K.brown,
    fontWeight: "600",
  },
  headerSubtitle: {
    ...typography.caption,
    color: K.textMuted,
    fontSize: 11,
  },
  headerSpacer: {
    width: 36,
  },
  contextBanner: {
    backgroundColor: K.blue,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  contextLabel: {
    ...typography.caption,
    color: K.brown,
    opacity: 0.7,
  },
  contextMeal: {
    ...typography.bodyMedium,
    color: K.brown,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  messageBubbleContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  esterContainer: {
    justifyContent: "flex-start",
  },
  userContainer: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  esterBubble: {
    backgroundColor: K.bone,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: K.brown,
    marginLeft: "auto",
    borderTopRightRadius: 4,
  },
  messageText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  esterText: {
    color: K.brown,
  },
  userText: {
    color: K.bone,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  typingBubble: {
    flexDirection: "row",
    backgroundColor: K.bone,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderTopLeftRadius: 4,
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: K.textMuted,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: K.border,
    backgroundColor: K.white,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: K.brown,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: K.ochre,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: K.border,
  },
  sendIcon: {
    fontSize: 20,
    color: K.brown,
    fontWeight: "bold",
  },
});
