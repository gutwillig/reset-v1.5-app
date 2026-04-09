import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
  Keyboard,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { K } from "../../constants/colors";
import { typography, spacing, radius } from "../../constants/typography";
import { Avatar } from "../../components";
import { useApp } from "../../context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  sendMessage as sendChatMessage,
  getSessions,
  getSessionMessages,
} from "../../services/chat";
import type { Meal } from "../../components";
import * as BrazeService from "../../services/braze";

const PENDING_NEW_CHAT_KEY = "@reset_pending_new_chat";

type ChatRouteParams = {
  EsterChat: {
    context?: "general" | "meal";
    meal?: Meal;
  };
};

interface ToolCall {
  toolName: string;
  data: Record<string, unknown>;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ester";
  timestamp: Date;
  crisisType?: "self_harm" | "eating_disorder";
  toolCalls?: ToolCall[];
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
  const [chatSessionId, setChatSessionId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();

  // Track keyboard height
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const defaultGreeting: Message = {
    id: "initial",
    text: "I'm your physician in your pocket. Ask me anything about your meals, energy, or how you're feeling. I'm here to help.",
    sender: "ester",
    timestamp: new Date(),
  };

  // Load existing session and messages on mount
  useEffect(() => {
    async function loadChatHistory() {
      try {
        // If user tapped "new chat" before leaving, don't reload the old session
        const pendingNew = await AsyncStorage.getItem(PENDING_NEW_CHAT_KEY);
        if (!pendingNew) {
          const sessions = await getSessions();
          if (sessions.length > 0) {
            // Resume the most recent session (shared across meal + general)
            const latestSession = sessions[0];
            setChatSessionId(latestSession.id);

            const history = await getSessionMessages(latestSession.id, 1, 50);
            if (history.data.length > 0) {
              const sorted = [...history.data].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
              // Use the earliest message timestamp to place the greeting before all history
              const earliestTime = new Date(sorted[0].createdAt);
              const greetingMsg: Message = {
                ...defaultGreeting,
                timestamp: new Date(earliestTime.getTime() - 1000),
              };
              const loaded: Message[] = [
                greetingMsg,
                ...sorted.map((msg) => ({
                  id: msg.id,
                  text: msg.content,
                  sender: msg.role === "user" ? "user" as const : "ester" as const,
                  timestamp: new Date(msg.createdAt),
                  toolCalls: msg.toolCalls as ToolCall[] | undefined,
                })),
              ];
              // If entering from a meal card, append the meal greeting
              if (meal) {
                loaded.push({
                  id: `meal-greeting-${Date.now()}`,
                  text: `Let's talk about ${meal.name}. What would you like to know — why I picked it, what you could swap, or something else?`,
                  sender: "ester",
                  timestamp: new Date(),
                });
              }
              setMessages(loaded);
              setIsLoadingHistory(false);
              return;
            }
          }
        }
      } catch {
        // Fall through to default greeting
      }

      // No existing session — show appropriate greeting
      const greeting: Message[] = [defaultGreeting];
      if (meal) {
        greeting.push({
          id: `meal-greeting-${Date.now()}`,
          text: `Let's talk about ${meal.name}. What would you like to know — why I picked it, what you could swap, or something else?`,
          sender: "ester",
          timestamp: new Date(),
        });
      }
      setMessages(greeting);
      setIsLoadingHistory(false);
    }

    loadChatHistory();
  }, [meal]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const messageText = inputText.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);
    setError(null);

    try {
      // Pass meal context as system-level context (not embedded in user message)
      const isNewMealChat = meal && !chatSessionId;
      const systemContext = isNewMealChat
        ? `[Context: User is asking about their meal "${meal.name}" - ${meal.calories} cal, ${meal.protein}g protein. Why line: ${meal.whyLine}]`
        : undefined;
      const assistantGreeting = isNewMealChat
        ? `Let's talk about ${meal.name}. What would you like to know — why I picked it, what you could swap, or something else?`
        : undefined;

      const response = await sendChatMessage(
        messageText,
        chatSessionId,
        systemContext,
        assistantGreeting,
      );

      // Track the session for follow-up messages
      if (!chatSessionId) {
        setChatSessionId(response.chatSessionId);
        BrazeService.logEvent("chat_started", { context });
        // Clear pending new chat flag — session is now active
        await AsyncStorage.removeItem(PENDING_NEW_CHAT_KEY);
      }

      const esterMessage: Message = {
        id: response.id,
        text: response.content,
        sender: "ester",
        timestamp: new Date(response.createdAt),
        crisisType: response.crisisType,
        toolCalls: response.toolCalls as ToolCall[] | undefined,
      };
      setMessages((prev) => [...prev, esterMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
      // Add an error message bubble so the user knows what happened
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "Sorry, I couldn't process that. Please try again.",
        sender: "ester",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    setChatSessionId(undefined);
    setMessages([defaultGreeting]);
    setError(null);
    // Persist the intent so re-entry doesn't reload the old session
    await AsyncStorage.setItem(PENDING_NEW_CHAT_KEY, "true");
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.outerContainer}>
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom }]}>
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
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Text style={styles.newChatIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Meal context banner (if chatting about a specific meal) */}
      {meal && (
        <View style={styles.contextBanner}>
          <Text style={styles.contextLabel}>Discussing</Text>
          <Text style={styles.contextMeal}>{meal.name}</Text>
        </View>
      )}

      {/* Messages */}
      {isLoadingHistory ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={K.textMuted} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) =>
            message.crisisType ? (
              <CrisisResourceCard key={message.id} message={message} />
            ) : (
              <React.Fragment key={message.id}>
                <MessageBubble message={message} />
                {message.toolCalls?.map((tc, i) =>
                  tc.toolName === "recommend_meal" && tc.data?.success ? (
                    <InlineMealCard key={`${message.id}-tool-${i}`} data={tc.data} />
                  ) : null
                )}
              </React.Fragment>
            )
          )}
          {isTyping && <TypingIndicator />}
        </ScrollView>
      )}

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
    </View>
    </View>
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

// Crisis resource card — renders tappable phone/text resources
function CrisisResourceCard({ message }: { message: Message }) {
  const resources =
    message.crisisType === "self_harm"
      ? [
          { label: "988 Suicide & Crisis Lifeline", action: "tel:988", actionLabel: "Call or text 988" },
          { label: "Crisis Text Line", action: "sms:741741&body=HOME", actionLabel: "Text HOME to 741741" },
        ]
      : [
          {
            label: "National Alliance for Eating Disorders",
            action: "tel:18666621235",
            actionLabel: "Call 1-866-662-1235",
          },
        ];

  return (
    <View style={styles.messageBubbleContainer}>
      <Avatar size={32} state="neutral" />
      <View style={styles.crisisCard}>
        <Text style={styles.crisisText}>
          {message.crisisType === "self_harm"
            ? "I hear you, and what you\u2019re feeling matters. Please reach out to someone who can help right now:"
            : "I hear you. This is beyond what I can help with, and I want you to get the right support:"}
        </Text>
        {resources.map((r) => (
          <TouchableOpacity
            key={r.action}
            style={styles.crisisButton}
            onPress={() => Linking.openURL(r.action)}
          >
            <Text style={styles.crisisButtonLabel}>{r.label}</Text>
            <Text style={styles.crisisButtonAction}>{r.actionLabel}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.crisisFooter}>
          I'm still here for your meals whenever you're ready.
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

// Inline meal card rendered inside chat when recommend_meal tool fires
function InlineMealCard({ data }: { data: Record<string, unknown> }) {
  const navigation = useNavigation();
  const meal = data.meal as Meal | undefined;
  if (!meal) return null;

  const handlePress = () => {
    (navigation as any).navigate("RecipeDetail", { meal });
  };

  return (
    <View style={styles.messageBubbleContainer}>
      <Avatar size={32} state="neutral" />
      <TouchableOpacity style={styles.inlineMealCard} onPress={handlePress} activeOpacity={0.8}>
        <Text style={styles.inlineMealSlot}>{(data.slot as string || "").toUpperCase()} ALTERNATIVE</Text>
        <Text style={styles.inlineMealName}>{meal.name}</Text>
        {meal.whyLine ? <Text style={styles.inlineMealWhy}>{meal.whyLine}</Text> : null}
        <View style={styles.inlineMealMeta}>
          <Text style={styles.inlineMealMetaText}>{meal.calories} cal</Text>
          <Text style={styles.inlineMealMetaDot}>&middot;</Text>
          <Text style={styles.inlineMealMetaText}>{meal.protein}g protein</Text>
          <Text style={styles.inlineMealMetaDot}>&middot;</Text>
          <Text style={styles.inlineMealMetaText}>{meal.prepTime} min</Text>
        </View>
        <Text style={styles.inlineMealTap}>Tap for full recipe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: K.bone,
  },
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
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: K.white,
    justifyContent: "center",
    alignItems: "center",
  },
  newChatIcon: {
    fontSize: 22,
    color: K.brown,
    fontWeight: "300",
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
    ...typography.caption,
    color: K.brown,
    fontWeight: "600",
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  hiddenInput: {
    height: 0,
    opacity: 0,
    position: "absolute",
  },
  crisisCard: {
    maxWidth: "80%",
    backgroundColor: K.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: K.err,
    padding: spacing.md,
    gap: spacing.sm,
  },
  crisisText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: K.brown,
  },
  crisisButton: {
    backgroundColor: K.bone,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  crisisButtonLabel: {
    ...typography.bodyMedium,
    color: K.brown,
    fontWeight: "600",
    fontSize: 14,
  },
  crisisButtonAction: {
    ...typography.caption,
    color: K.blue,
    marginTop: 2,
  },
  crisisFooter: {
    ...typography.caption,
    color: K.textMuted,
    marginTop: spacing.sm,
  },
  inlineMealCard: {
    maxWidth: "80%",
    backgroundColor: K.bone,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: K.ochre + "40",
  },
  inlineMealSlot: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: K.ochre,
    fontWeight: "600",
    marginBottom: 4,
  },
  inlineMealName: {
    ...typography.bodyMedium,
    color: K.brown,
    fontWeight: "600",
    marginBottom: 4,
  },
  inlineMealWhy: {
    ...typography.caption,
    color: K.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  inlineMealMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  inlineMealMetaText: {
    ...typography.caption,
    color: K.brown,
    fontWeight: "500",
  },
  inlineMealMetaDot: {
    color: K.textMuted,
    fontSize: 10,
  },
  inlineMealTap: {
    ...typography.caption,
    color: K.ochre,
    fontWeight: "500",
    fontSize: 11,
  },
});
