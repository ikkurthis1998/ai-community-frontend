"use client";

import { useState, useRef, useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import MessageForm from "./MessageForm";

export default function ChatComponent(): JSX.Element {
  const {
    chats,
    currentChat,
    messages,
    loading,
    selectChat,
    createNewChat,
    addMessage,
    deleteChat,
  } = useChat();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userInput = input; // Store input before clearing
      setInput(""); // Clear input immediately after submit
      setIsLoading(true);
      setStreamingContent("");

      try {
        // If no current chat, create a new one
        let activeChatId = currentChat?.id;
        if (!activeChatId) {
          activeChatId = await createNewChat(
            userInput.slice(0, 30) + "...",
            "llama3.2",
          );
          await selectChat(activeChatId);
        }

        // Add user message
        await addMessage(activeChatId, userInput, "user");

        // Initialize abort controller for the fetch request
        abortControllerRef.current = new AbortController();

        // Prepare messages for API call
        const currentMessages = messages.map(({ role, content }) => ({
          role,
          content,
        }));
        currentMessages.push({ role: "user", content: userInput });

        // Make API call
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3.2",
            messages: currentMessages,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle streaming response
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
        await addMessage(activeChatId, accumulatedContent, "assistant");
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
    [
      input,
      isLoading,
      currentChat,
      messages,
      createNewChat,
      selectChat,
      addMessage,
    ],
  );

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const startNewChat = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const newChatId = await createNewChat("New Chat", "llama3.2");
    await selectChat(newChatId);
    setInput("");
    setStreamingContent("");
    setIsLoading(false);
  }, [selectChat, createNewChat]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-zinc-500 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar
        chats={chats}
        currentChatId={currentChat?.id || null}
        startNewChat={startNewChat}
        selectChat={selectChat}
        deleteChat={deleteChat}
      />
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
        {currentChat ? (
          <>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h1 className="text-lg font-medium">{currentChat.title}</h1>
            </div>
            <ChatWindow
              messages={messages}
              streamingContent={streamingContent}
            />
            <MessageForm
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              handleCancel={handleCancel}
              isLoading={isLoading}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              Start a new chat
            </div>
            <MessageForm
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              handleCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
