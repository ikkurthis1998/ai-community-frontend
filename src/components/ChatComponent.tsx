"use client";

import { useState, useRef, useCallback } from "react";
import ChatWindow from "./ChatWindow";
import MessageForm from "./MessageForm";
import { ModelOption } from "@/types/chat";
import { modelOptions } from "@/config/models";
import SettingsBar from "./SettingsBar";
import ErrorMessage from "./ErrorMessage";

type Role = "assistant" | "user";

interface Message {
  role: Role;
  content: string;
}

export default function ChatComponent(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelOption>(
    modelOptions[0],
  );
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      setError(null);
      const userInput = input;
      setInput("");
      setIsLoading(true);
      setStreamingContent("");

      try {
        const updatedMessages: Message[] = [
          ...messages,
          { role: "user", content: userInput },
        ];
        setMessages(updatedMessages);

        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel.modelId,
            messages: updatedMessages,
            provider: selectedModel.provider,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (!line.trim() || !line.startsWith("data: ")) continue;

            try {
              const jsonStr = line.replace("data: ", "");
              const parsed = JSON.parse(jsonStr);

              if (selectedModel.provider === "vertex-ai") {
                const content = parsed.choices?.[0]?.delta?.content || "";
                accumulatedContent += content;
              } else {
                const content = parsed.message?.content || "";
                accumulatedContent += content;
              }

              setStreamingContent(accumulatedContent);
            } catch (error) {
              console.error("Error parsing JSON:", error);
            }
          }
        }

        setMessages([
          ...updatedMessages,
          { role: "assistant", content: accumulatedContent },
        ]);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("Request aborted");
        } else {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred";
          setError(errorMessage);
          console.error("Error during chat:", error);
        }
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [input, isLoading, messages, selectedModel],
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
        <SettingsBar
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onClearChat={clearChat}
        />
        <ChatWindow messages={messages} streamingContent={streamingContent} />
        <MessageForm
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          isLoading={isLoading}
        />
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
      </div>
    </div>
  );
}
