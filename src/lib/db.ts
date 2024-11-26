import Dexie, { Table } from "dexie";
import { Chat, Message } from "@/types/chat";

export class ChatDatabase extends Dexie {
  chats!: Table<Chat>;
  messages!: Table<Message>;

  constructor() {
    super("ChatDatabase");
    this.version(1).stores({
      chats: "++id, title, model, timestamp",
      messages: "++id, chatId, role, content, timestamp",
    });
  }
}

export const db = new ChatDatabase();

// Helper functions
export async function getAllChats(): Promise<Chat[]> {
  return await db.chats.orderBy("timestamp").reverse().toArray();
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  return await db.messages.where("chatId").equals(chatId).toArray();
}

export async function createChat(chat: Omit<Chat, "id">): Promise<string> {
  return (await db.chats.add(chat)) as string;
}

export async function deleteChat(chatId: string): Promise<void> {
  await db.transaction("rw", db.chats, db.messages, async () => {
    await db.chats.delete(chatId);
    await db.messages.where("chatId").equals(chatId).delete();
  });
}

export async function addMessage(
  message: Omit<Message, "id">,
): Promise<string> {
  return (await db.messages.add({
    ...message,
    timestamp: Date.now(),
  })) as string;
}
