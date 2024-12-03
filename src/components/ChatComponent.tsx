"use client";

import { useState, useRef, useCallback } from "react";
import ChatWindow from "./ChatWindow";
import MessageForm from "./MessageForm";

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
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userInput = input;
      setInput("");
      setIsLoading(true);
      setStreamingContent("");

      try {
        // Add user message
        const updatedMessages: Message[] = [
          ...messages,
          { role: "user", content: userInput },
        ];
        setMessages(updatedMessages);

        // Initialize abort controller
        abortControllerRef.current = new AbortController();

        // Make direct API call to Ollama
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_OLLAMA_HOST}/api/chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama3.2",
              messages: updatedMessages,
              stream: true,
            }),
            signal: abortControllerRef.current.signal,
          },
        );

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
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed && !parsed.done) {
                const content = parsed.message?.content || "";
                accumulatedContent += content;
                setStreamingContent(accumulatedContent);
              }
            } catch (error) {
              console.error("Error parsing JSON:", error);
            }
          }
        }

        // Add assistant's complete response
        setMessages([
          ...updatedMessages,
          { role: "assistant" as const, content: accumulatedContent },
        ]);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("Request aborted");
        } else {
          console.error("Error during chat:", error);
        }
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [input, isLoading, messages],
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
        <ChatWindow messages={messages} streamingContent={streamingContent} />
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
