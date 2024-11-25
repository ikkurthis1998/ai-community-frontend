export type Message = {
  role: "assistant" | "user";
  content: string;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  timestamp: number;
};
