import { Chat } from "@/types/chat";

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  startNewChat: () => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
}

export default function Sidebar({
  chats,
  currentChatId,
  startNewChat,
  selectChat,
  deleteChat,
}: SidebarProps) {
  return (
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
            onClick={() => {
              if (chat.id !== undefined && chat.id !== "") {
                selectChat(chat.id as string);
              }
            }}
          >
            <span className="truncate flex-1 text-sm">{chat.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(chat.id as string);
              }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
