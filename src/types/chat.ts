export interface Message {
  id?: string;
  chatId: string;
  role: "assistant" | "user";
  content: string;
  timestamp: number;
}

export interface Chat {
  id?: string;
  title: string;
  model: string;
  timestamp: number;
}
