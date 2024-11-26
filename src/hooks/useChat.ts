import { useState, useEffect } from "react";
import { Chat, Message } from "@/types/chat";
import * as db from "@/lib/db";

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    try {
      const loadedChats = await db.getAllChats();
      setChats(loadedChats);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load chats:", error);
      setLoading(false);
    }
  }

  async function selectChat(chatId: string) {
    try {
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        setCurrentChat(chat);
        const chatMessages = await db.getChatMessages(chatId);
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error("Failed to select chat:", error);
    }
  }

  async function createNewChat(title: string, model: string) {
    try {
      const chatId = await db.createChat({
        title,
        model,
        timestamp: Date.now(),
      });
      await loadChats();
      return chatId;
    } catch (error) {
      console.error("Failed to create chat:", error);
      throw error;
    }
  }

  async function addMessage(
    chatId: string,
    content: string,
    role: "user" | "assistant",
  ) {
    try {
      await db.addMessage({
        chatId,
        content,
        role,
        timestamp: Date.now(),
      });
      const updatedMessages = await db.getChatMessages(chatId);
      setMessages(updatedMessages);
    } catch (error) {
      console.error("Failed to add message:", error);
      throw error;
    }
  }

  async function deleteChat(chatId: string) {
    try {
      await db.deleteChat(chatId);
      await loadChats();
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      throw error;
    }
  }

  return {
    chats,
    currentChat,
    messages,
    loading,
    selectChat,
    createNewChat,
    addMessage,
    deleteChat,
  };
}
