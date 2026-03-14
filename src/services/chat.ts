import { apiClient } from "./apiClient";

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant" | "tool";
  chatSessionId: string;
  createdAt: string;
  toolCalls?: Array<{
    toolName: string;
    data: unknown;
  }>;
}

export interface ChatSession {
  id: string;
  title: string;
  personaId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export async function sendMessage(
  message: string,
  chatSessionId?: string,
  systemContext?: string,
  assistantGreeting?: string,
): Promise<ChatMessage> {
  const body: Record<string, unknown> = { message };
  if (chatSessionId) body.chatSessionId = chatSessionId;
  if (systemContext) body.systemContext = systemContext;
  if (assistantGreeting) body.assistantGreeting = assistantGreeting;

  return apiClient<ChatMessage>("/api/chat/send", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getSessions(): Promise<ChatSession[]> {
  return apiClient<ChatSession[]>("/api/chat/sessions");
}

export async function getSessionMessages(
  sessionId: string,
  page = 1,
  limit = 50,
): Promise<{ data: ChatMessage[]; total: number; totalPages: number }> {
  return apiClient(`/api/chat/${sessionId}/messages?page=${page}&limit=${limit}`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
}
