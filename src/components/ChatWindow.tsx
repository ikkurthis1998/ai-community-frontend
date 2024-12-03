import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

// Configure marked with highlighting
const renderer = new marked.Renderer();

renderer.code = function ({ text, lang, escaped }) {
  const validLanguage = hljs.getLanguage(lang || "") ? lang : "plaintext";
  const highlightedCode = validLanguage
    ? hljs.highlight(text, { language: validLanguage }).value
    : escaped;

  return `<pre><code class="hljs language-${validLanguage}">${highlightedCode}</code></pre>`;
};

marked.use({
  renderer,
  gfm: true,
  breaks: true,
});
type Role = "assistant" | "user";

interface Message {
  role: Role;
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  streamingContent: string;
}

export default function ChatWindow({
  messages,
  streamingContent,
}: ChatWindowProps) {
  const renderMarkdown = (content: string) => {
    try {
      const html = marked.parse(content);
      return (
        <div
          className="prose dark:prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch (error) {
      console.error("Markdown parsing error:", error);
      return <div className="whitespace-pre-wrap">{content}</div>;
    }
  };

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
            <div className="text-sm leading-relaxed">
              {message.role === "assistant" ? (
                renderMarkdown(message.content)
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Streaming message */}
      {streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            <div className="text-xs font-medium mb-1 opacity-70">AI</div>
            <div className="text-sm leading-relaxed">
              {renderMarkdown(streamingContent)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
