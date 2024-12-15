import { useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import LoadingDots from "./LoadingDots";
import LlamaIcon from "./LlamaIcon";
import FunkyUserIcon from "./FunkyUserIcon";
import UserIcon from "./UserIcon";

interface Message {
  role: "assistant" | "user";
  content: string;
}

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
    const renderer = new marked.Renderer();

    renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
      const validLanguage = hljs.getLanguage(lang || "") ? lang : "plaintext";
      const highlightedCode = hljs.highlight(text, {
        language: validLanguage || "plaintext",
      }).value;

      return `
        <div class="code-block">
          <div class="code-header">
            <span class="code-language">${validLanguage}</span>
            <button class="copy-button" data-code="${encodeURIComponent(text)}">Copy</button>
          </div>
          <pre><code class="hljs language-${validLanguage}">${highlightedCode}</code></pre>
        </div>
      `;
    };

    marked.setOptions({
      renderer,
      gfm: true,
      breaks: true,
    });
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const renderMessage = (content: string, role: string) => {
    const html = marked(content);

    return (
      <div
        className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-4`}
      >
        {role === "assistant" && (
          <div className="flex items-start mr-2">
            <div className="bg-zinc-700 rounded-lg">
              <LlamaIcon className="text-white rounded-lg" />
            </div>
          </div>
        )}
        <div className={`max-w-[80%] rounded-lg p-4 bg-zinc-800 text-zinc-100`}>
          <div className="mb-2 text-sm font-medium opacity-70">
            {role === "user" ? "You" : "AI"}
          </div>
          <div
            className={`prose ${role === "user" ? "prose-invert" : "dark:prose-invert"} prose-sm max-w-none`}
            dangerouslySetInnerHTML={{ __html: html }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.classList.contains("copy-button")) {
                e.preventDefault();
                const code = decodeURIComponent(target.dataset.code || "");
                handleCopy(code);
                target.textContent = "Copied!";
                setTimeout(() => {
                  target.textContent = "Copy";
                }, 2000);
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
      {/* Spacer div that pushes content to bottom */}
      <div className="flex-1" />

      {/* Messages container */}
      <div className="p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>{renderMessage(message.content, message.role)}</div>
        ))}

        {streamingContent && (
          <div>{renderMessage(streamingContent, "assistant")}</div>
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
