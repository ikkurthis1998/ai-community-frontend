"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Chat, Message } from "@/types/chat";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import MessageForm from "./MessageForm";

export default function ChatComponent(): JSX.Element {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useLocalStorage<Chat[]>("chats", []);
  const [currentChatId, setCurrentChatId] = useLocalStorage<string | null>(
    "currentChatId",
    null,
  );
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  console.log("Component rendered");

  const currentChat = currentChatId
    ? chats.find((chat) => chat.id === currentChatId)
    : null;
  console.log("Current chat:", currentChat);

  const safeParseJSON = (jsonString: string) => {
    try {
      console.log("Parsing JSON string:", jsonString);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("JSON parse error:", error);
      return null;
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Form submitted with input:", input);
      if (!input.trim() || isLoading) {
        console.log("Input is empty or loading is in progress, returning.");
        return;
      }

      const userMessage: Message = { role: "user", content: input };
      const chatId = currentChatId || Date.now().toString();
      console.log("User message:", userMessage);
      console.log("Chat ID:", chatId);

      // First, add the user message to the chat
      setChats((prevChats) => {
        if (!currentChatId) {
          const newChat: Chat = {
            id: chatId,
            title: input.slice(0, 30) + "...",
            messages: [userMessage],
            model: "llama3.2",
            timestamp: Date.now(),
          };
          console.log("Creating a new chat:", newChat);
          return [newChat, ...prevChats];
        } else {
          console.log("Adding message to existing chat:", currentChatId);
          return prevChats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: chat.messages
                    ? [...chat.messages, userMessage]
                    : [userMessage],
                }
              : chat,
          );
        }
      });

      if (!currentChatId) {
        console.log("Setting current chat ID to:", chatId);
        setCurrentChatId(chatId);
      }

      setInput("");
      setIsLoading(true);
      setStreamingContent("");
      console.log(
        "Reset input, set loading to true and cleared streaming content.",
      );

      try {
        const currentMessages = !currentChatId
          ? [userMessage]
          : [
              ...(chats.find((chat) => chat.id === currentChatId)?.messages ||
                []),
              userMessage,
            ];
        console.log("Current messages for API call:", currentMessages);

        abortControllerRef.current = new AbortController();
        console.log("AbortController initialized.");

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3.2",
            messages: currentMessages,
          }),
          signal: abortControllerRef.current.signal,
        });
        console.log("API call made.");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Response received:", response);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");
        console.log("Reader created.");

        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          console.log("Chunk received:", value);

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n").filter(Boolean);
          console.log("Decoded lines:", lines);

          for (const line of lines) {
            const parsed = safeParseJSON(line);
            console.log("Parsed line:", parsed);
            if (parsed && !parsed.done) {
              const content = parsed.message?.content || "";
              accumulatedContent += content;
              setStreamingContent(accumulatedContent);
              console.log("Updated streaming content:", accumulatedContent);
            }
          }
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: accumulatedContent,
        };
        console.log("Assistant message:", assistantMessage);

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId
              ? { ...chat, messages: [...chat.messages, assistantMessage] }
              : chat,
          ),
        );
        console.log("Chat updated with assistant message.");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to fetch response:", error);
        }
      } finally {
        setIsLoading(false);
        console.log(
          "Fetch completed. Loading set to false and streaming content cleared.",
        );
      }
    },
    [input, isLoading, currentChatId, chats, setChats, setCurrentChatId],
  );

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Fetch operation aborted.");
    }
  };

  const startNewChat = useCallback(() => {
    setCurrentChatId(null);
    setInput("");
    setStreamingContent("");
    setIsLoading(false);
    console.log("Starting a new chat session.");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [setCurrentChatId]);

  const selectChat = useCallback(
    (chatId: string) => {
      setCurrentChatId(chatId);
      console.log("Chat selected:", chatId);
    },
    [setCurrentChatId],
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      console.log("Deleting chat:", chatId);
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        console.log("Current chat deleted, resetting current chat ID.");
      }
    },
    [currentChatId, setChats, setCurrentChatId],
  );

  useEffect(() => {
    if (currentChatId && !currentChat) {
      const selectedChat = chats.find((chat) => chat.id === currentChatId);
      if (selectedChat) {
        setCurrentChatId(selectedChat.id);
      }
    }
  }, [currentChatId, chats, currentChat]);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
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
              messages={currentChat.messages}
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
