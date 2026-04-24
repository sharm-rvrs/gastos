"use client";

import { useState, useRef, useEffect } from "react";
import {
  Stack,
  Paper,
  Text,
  TextInput,
  Button,
  Group,
  Avatar,
  ScrollArea,
  Loader,
  ActionIcon,
  SimpleGrid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconSend,
  IconRobot,
  IconUser,
  IconRefresh,
} from "@tabler/icons-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hoy! 👋 I'm Peso Buddy, your personal finance assistant! I know your expenses, budgets, and savings goals. Ask me anything — from tipid tips to budget advice. Kaya natin 'to! 💪",
};

const SUGGESTED_PROMPTS = [
  "Am I overspending this month?",
  "Where can I cut my expenses?",
  "How is my savings going?",
  "Give me a tipid tip for groceries",
  "What's my biggest expense category?",
  "How long until I reach my savings goal?",
];

const STORAGE_KEY = "peso_buddy_chat";

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, hydrated]);

  // Auto scroll to bottom
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText) return;

    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const history = updatedMessages
        .slice(-10)
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, history }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to get response from Peso Buddy",
        color: "red",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const resetMessage = [
      {
        role: "assistant" as const,
        content:
          "Chat cleared! 🧹 What else can I help you with? Ask me about your expenses, budgets, or savings goals!",
      },
    ];
    setMessages(resetMessage);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetMessage));
    } catch {}
  };

  return (
    <Stack gap="md" h="100%">
      {/* Suggested Prompts — only on fresh chat */}
      {messages.length === 1 && (
        <div>
          <Text size="xs" c="dimmed" fw={500} mb="xs">
            SUGGESTED QUESTIONS
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                variant="light"
                size="xs"
                color="teal"
                onClick={() => sendMessage(prompt)}
                styles={{
                  root: {
                    height: "auto",
                    padding: "8px 12px",
                    whiteSpace: "normal",
                    textAlign: "left",
                  },
                  label: { whiteSpace: "normal" },
                }}
              >
                {prompt}
              </Button>
            ))}
          </SimpleGrid>
        </div>
      )}

      {/* Chat Messages */}
      <Paper radius="md" withBorder style={{ flex: 1 }}>
        <ScrollArea h={450} viewportRef={viewport} p="md">
          <Stack gap="md">
            {messages.map((msg, i) => (
              <Group
                key={i}
                align="flex-start"
                justify={msg.role === "user" ? "flex-end" : "flex-start"}
                gap="sm"
              >
                {msg.role === "assistant" && (
                  <Avatar color="teal" radius="xl" size="sm">
                    <IconRobot size={16} />
                  </Avatar>
                )}
                <Paper
                  p="sm"
                  radius="md"
                  maw="75%"
                  style={{
                    backgroundColor:
                      msg.role === "user"
                        ? "var(--mantine-color-blue-6)"
                        : "var(--mantine-color-gray-1)",
                  }}
                >
                  <Text
                    size="sm"
                    style={{
                      color:
                        msg.role === "user"
                          ? "white"
                          : "var(--mantine-color-gray-9)",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                    }}
                  >
                    {msg.content}
                  </Text>
                </Paper>
                {msg.role === "user" && (
                  <Avatar color="blue" radius="xl" size="sm">
                    <IconUser size={16} />
                  </Avatar>
                )}
              </Group>
            ))}

            {loading && (
              <Group align="flex-start" gap="sm">
                <Avatar color="teal" radius="xl" size="sm">
                  <IconRobot size={16} />
                </Avatar>
                <Paper
                  p="sm"
                  radius="md"
                  style={{ backgroundColor: "var(--mantine-color-gray-1)" }}
                >
                  <Group gap="xs">
                    <Loader size="xs" color="teal" />
                    <Text size="sm" c="dimmed">
                      Peso Buddy is thinking...
                    </Text>
                  </Group>
                </Paper>
              </Group>
            )}
          </Stack>
        </ScrollArea>
      </Paper>

      {/* Input */}
      <Group gap="sm">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={handleReset}
          title="Clear chat"
        >
          <IconRefresh size={18} />
        </ActionIcon>
        <TextInput
          style={{ flex: 1 }}
          placeholder="Ask Peso Buddy anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={loading}
          rightSection={
            <ActionIcon
              color="teal"
              variant="filled"
              size="sm"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <IconSend size={14} />
            </ActionIcon>
          }
        />
      </Group>
    </Stack>
  );
}
