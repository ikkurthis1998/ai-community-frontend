import { ModelOption } from "@/types/chat";
import { modelOptions } from "@/config/models";
import { useState } from "react";

interface ModelSelectorProps {
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [isChanging, setIsChanging] = useState(false);

  const handleModelChange = async (model: ModelOption) => {
    setIsChanging(true);
    try {
      await onModelChange(model);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-zinc-500 dark:text-zinc-400">Model:</label>
      <select
        value={selectedModel.id}
        onChange={(e) => {
          const model = modelOptions.find((m) => m.id === e.target.value);
          if (model) handleModelChange(model);
        }}
        disabled={isChanging}
        className="px-2 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 border
                 border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none
                 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400
                 disabled:opacity-50"
      >
        {modelOptions.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      {isChanging && (
        <span className="text-sm text-zinc-500">Switching...</span>
      )}
    </div>
  );
}
