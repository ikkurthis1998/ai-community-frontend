"use client";

import { useState, useRef, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Chat, Message } from "@/types/chat";

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

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  useEffect(() => {
    console.log("Current chats:", chats);
    console.log("Current chat ID:", currentChatId);
  }, [chats, currentChatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const chatId = currentChatId || Date.now().toString();

    // First, add the user message to the chat
    setChats((prevChats) => {
      if (!currentChatId) {
        // Create new chat
        const newChat: Chat = {
          id: chatId,
          title: input.slice(0, 30) + "...",
          messages: [userMessage],
          model: "llama3.2",
          timestamp: Date.now(),
        };
        return [newChat, ...prevChats];
      } else {
        // Update existing chat
        return prevChats.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage],
              }
            : chat,
        );
      }
    });

    // Set current chat ID if it's a new chat
    if (!currentChatId) {
      setCurrentChatId(chatId);
    }

    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      // Get current messages for the API request
      const currentMessages = !currentChatId
        ? [userMessage]
        : [
            ...chats.find((chat) => chat.id === currentChatId)!.messages,
            userMessage,
          ];

      abortControllerRef.current = new AbortController();

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
            if (parsed.done) continue;

            const content = parsed.message?.content || "";
            accumulatedContent += content;
            setStreamingContent(accumulatedContent);
          } catch (error) {
            console.error("Error parsing line:", error);
          }
        }
      }

      // After streaming is complete, update the chat with the AI response
      console.log("Accumulated content:", accumulatedContent); // Debug log

      const assistantMessage: Message = {
        role: "assistant",
        content: accumulatedContent,
      };

      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (chat.id === chatId) {
            console.log("Updating chat:", chat.id); // Debug log
            return {
              ...chat,
              messages: [...chat.messages, assistantMessage],
            };
          }
          return chat;
        });
        console.log("Updated chats:", updatedChats); // Debug log
        return updatedChats;
      });
    } catch (err) {
      const error = err as Error;
      if (error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error("Failed to fetch response:", error);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent("");
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setInput("");
    setStreamingContent("");
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const deleteChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={startNewChat}
            className="w-full px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-200 font-medium"
          >
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors duration-200 ${
                chat.id === currentChatId
                  ? "bg-zinc-200 dark:bg-zinc-800"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              }`}
              onClick={() => selectChat(chat.id)}
            >
              <span className="truncate flex-1 text-sm">{chat.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
        {currentChat ? (
          <>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h1 className="text-lg font-medium">{currentChat.title}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {currentChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {message.role === "user" ? "You" : "AI"}
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming message */}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                    <div className="text-xs font-medium mb-1 opacity-70">
                      AI
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {streamingContent}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-all duration-200"
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  >
                    Send
                  </button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              Select a chat or start a new one
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-all duration-200"
                  placeholder="Type your message to start a new chat..."
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  disabled={isLoading}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
