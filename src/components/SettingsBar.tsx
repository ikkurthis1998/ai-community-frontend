import { ModelOption } from "@/types/chat";
import ModelSelector from "./ModelSelector";

interface SettingsBarProps {
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  onClearChat: () => void;
}

export default function SettingsBar({
  selectedModel,
  onModelChange,
  onClearChat,
}: SettingsBarProps) {
  return (
    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-medium">Chat</h1>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearChat}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg
                     hover:bg-red-600 transition-colors duration-200"
          >
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
}
