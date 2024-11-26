import { Message } from "@/types/chat";
import React from "react";

interface ChatWindowProps {
  messages: Message[];
  streamingContent: string;
}

export default function ChatWindow({
  messages,
  streamingContent,
}: ChatWindowProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((message, index) => (
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
            <div className="text-xs font-medium mb-1 opacity-70">AI</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {streamingContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
