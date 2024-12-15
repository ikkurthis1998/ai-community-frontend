"use client";

import { useState, useRef, useCallback } from "react";
import ChatWindow from "./ChatWindow";
import MessageForm from "./MessageForm";
import { useToast } from "@/contexts/ToastContext";
import type { ErrorMessage, Message } from "@/types/chat";

export default function ChatComponent(): JSX.Element {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const createMessage = (
    role: Message["role"],
    content: string,
    existingChatId?: string,
    error?: ErrorMessage,
  ): Message => {
    return {
      role,
      content,
      chatId: existingChatId || `chat_${Date.now()}`,
      timestamp: Date.now(),
      ...(error && { error }),
    };
  };

  const handleError = useCallback(
    (error: Error | unknown, type: ErrorMessage["type"]) => {
      let errorMessage: ErrorMessage;

      switch (type) {
        case "api":
          errorMessage = {
            type: "api",
            message: `API Error: ${error instanceof Error ? error.message : "Unknown API error"}`,
          };
          break;
        case "network":
          errorMessage = {
            type: "network",
            message: "Network error: Please check your internet connection",
          };
          break;
        case "parsing":
          errorMessage = {
            type: "parsing",
            message: "Failed to parse the response from the server",
          };
          break;
        case "cancel":
          errorMessage = {
            type: "cancel",
            message: "Request cancelled by user",
          };
          break;
        case "model_unavailable":
          errorMessage = {
            type: "model_unavailable",
            message:
              "The AI model is currently unavailable. Please try again later.",
          };
          break;
        case "empty_response":
          errorMessage = {
            type: "empty_response",
            message:
              "Received empty response from the model. Please try again.",
          };
          break;
        default:
          errorMessage = {
            type: "unknown",
            message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
      }

      showToast(errorMessage.message, "error");

      setMessages((prev) => [
        ...prev,
        createMessage(
          "error",
          errorMessage.message,
          prev[0]?.chatId,
          errorMessage,
        ),
      ]);

      return errorMessage;
    },
    [showToast],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userInput = input;
      setInput("");
      setIsLoading(true);
      setStreamingContent("");

      try {
        const userMessage = createMessage(
          "user",
          userInput,
          messages[0]?.chatId,
        );
        const updatedMessages: Message[] = [...messages, userMessage];
        setMessages(updatedMessages);

        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3.2",
            messages: updatedMessages,
          }),
          signal: abortControllerRef.current.signal,
        }).catch((error) => {
          if (error.name === "AbortError") {
            throw new Error("Request cancelled");
          }
          throw new Error("Network error");
        });

        if (response.status === 503) {
          throw new Error("model_unavailable");
        }

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream available");

        let accumulatedContent = "";
        let hasReceivedContent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed && !parsed.done) {
                const content = parsed.message?.content || "";
                if (content) {
                  hasReceivedContent = true;
                  accumulatedContent += content;
                  setStreamingContent(accumulatedContent);
                }
              }
            } catch (error) {
              handleError(error, "parsing");
              continue;
            }
          }
        }

        if (!hasReceivedContent) {
          throw new Error("empty_response");
        }

        setMessages((prev) => [
          ...prev,
          createMessage("assistant", accumulatedContent, prev[0]?.chatId),
        ]);
      } catch (error) {
        if (error instanceof Error) {
          switch (error.message) {
            case "Request cancelled":
              handleError(error, "cancel");
              break;
            case "Network error":
              handleError(error, "network");
              break;
            case "model_unavailable":
              handleError(error, "model_unavailable");
              break;
            case "empty_response":
              handleError(error, "empty_response");
              break;
            default:
              if (error.message.includes("API returned")) {
                handleError(error, "api");
              } else {
                handleError(error, "unknown");
              }
          }
        } else {
          handleError(error, "unknown");
        }
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [input, isLoading, messages, handleError],
  );

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent("");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h1 className="text-lg font-medium">Chat</h1>
          <button
            onClick={clearChat}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Clear Chat
          </button>
        </div>
        <ChatWindow
          messages={messages}
          streamingContent={streamingContent}
          isLoading={isLoading}
        />
        <MessageForm
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
