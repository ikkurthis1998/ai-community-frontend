export interface Message {
  id?: string;
  chatId: string;
  role: "assistant" | "user" | "error";
  content: string;
  timestamp: number;
  error?: ErrorMessage;
}

export interface Chat {
  id?: string;
  title: string;
  model: string;
  timestamp: number;
}

export interface ErrorMessage {
  type:
    | "api"
    | "network"
    | "parsing"
    | "cancel"
    | "unknown"
    | "model_unavailable"
    | "empty_response";
  message: string;
}
