import { useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import LoadingDots from "./LoadingDots";
import LlamaIcon from "./LlamaIcon";
import UserIcon from "./UserIcon";
import { ErrorMessage, Message } from "@/types/chat";

interface ChatWindowProps {
  messages: Message[];
  streamingContent: string;
  isLoading: boolean;
}

export default function ChatWindow({
  messages,
  streamingContent,
  isLoading,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    hljs.configure({
      ignoreUnescapedHTML: true,
      languages: [
        "javascript",
        "typescript",
        "python",
        "bash",
        "json",
        "html",
        "css",
        "rust",
        "go",
        "java",
        "c",
      ],
    });

    const renderer = new marked.Renderer();

    renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
      const validLanguage = hljs.getLanguage(lang || "") ? lang : "plaintext";
      const highlightedCode = validLanguage
        ? hljs.highlight(text, { language: validLanguage }).value
        : text;

      return `
        <div class="relative my-4 rounded-lg overflow-hidden bg-[#1E1E1E]">
          <div class="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
            <span class="text-xs font-mono text-zinc-400">${validLanguage}</span>
            <button class="copy-button px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-md transition-colors" data-code="${encodeURIComponent(text)}">
              Copy
            </button>
          </div>
          <div class="overflow-x-auto">
            <pre class="p-4"><code class="!bg-transparent hljs language-${validLanguage}">${highlightedCode}</code></pre>
          </div>
        </div>
      `;
    };

    marked.setOptions({
      renderer,
      gfm: true,
      breaks: true,
    });
  }, []);

  const handleCopy = async (code: string, button: HTMLButtonElement) => {
    try {
      await navigator.clipboard.writeText(code);
      // Only modify the clicked button
      button.innerHTML = "Copied!";
      button.classList.add("text-green-400");
      setTimeout(() => {
        button.innerHTML = "Copy";
        button.classList.remove("text-green-400");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const renderMessage = (message: Message) => {
    const { content, role, error } = message;
    const html = marked(content);

    const getMessageStyle = (role: string, error?: ErrorMessage) => {
      if (role === "error") {
        switch (error?.type) {
          case "api":
            return "bg-red-500/10 text-red-500 border border-red-500/20";
          case "network":
            return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
          case "parsing":
            return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
          case "cancel":
            return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
          case "model_unavailable":
            return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
          case "empty_response":
            return "bg-gray-500/10 text-gray-500 border border-gray-500/20";
          default:
            return "bg-red-500/10 text-red-500 border border-red-500/20";
        }
      }
      return "bg-zinc-800 text-zinc-100";
    };

    const getMessageIcon = (role: string, error?: ErrorMessage) => {
      if (role === "error") {
        switch (error?.type) {
          case "api":
            return "⚠️";
          case "network":
            return "🌐";
          case "parsing":
            return "⚙️";
          case "cancel":
            return "🚫";
          case "model_unavailable":
            return "🤖";
          case "empty_response":
            return "📭";
          default:
            return "❌";
        }
      }
      return role === "user" ? "👤" : "🤖";
    };

    return (
      <div
        className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-4`}
      >
        {role !== "user" && (
          <div className="flex items-start mr-2">
            <div
              className={`${
                role === "error" ? "bg-transparent p-1" : "bg-zinc-700"
              } rounded-lg`}
            >
              {role === "assistant" ? (
                <LlamaIcon className="text-white rounded-lg" />
              ) : (
                <span className="text-xl">{getMessageIcon(role, error)}</span>
              )}
            </div>
          </div>
        )}
        <div
          className={`max-w-[80%] rounded-lg p-4 ${getMessageStyle(role, error)}`}
        >
          <div className="mb-2 text-sm font-medium opacity-70">
            {role === "user"
              ? "You"
              : role === "error"
                ? error?.type.toUpperCase()
                : "AI"}
          </div>
          <div
            className={`prose ${
              role === "error"
                ? "prose-sm"
                : role === "user"
                  ? "prose-invert"
                  : "dark:prose-invert"
            } prose-sm max-w-none`}
            dangerouslySetInnerHTML={{ __html: html }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.classList.contains("copy-button")) {
                e.preventDefault();
                const code = decodeURIComponent(target.dataset.code || "");
                handleCopy(code, target as HTMLButtonElement);
              }
            }}
          />
        </div>
        {role === "user" && (
          <div className="flex items-start ml-2">
            <div className="p-1 bg-zinc-700 hover:bg-zinc-600 transition-colors rounded-lg cursor-pointer">
              <UserIcon className="text-white w-6 h-6" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1" />
      <div className="p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>{renderMessage(message)}</div>
        ))}

        {streamingContent && (
          <div>
            {renderMessage({
              role: "assistant",
              content: streamingContent,
              timestamp: Date.now(),
              chatId: messages[0]?.chatId,
            })}
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start mr-2">
              <div className="bg-zinc-700 rounded-lg">
                <LlamaIcon className="text-white rounded-lg" />
              </div>
            </div>
            <div className="max-w-[80%] rounded-lg p-4 bg-zinc-800 text-zinc-100">
              <div className="mb-2 text-sm font-medium opacity-70">AI</div>
              <LoadingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
