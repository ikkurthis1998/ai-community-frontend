import React, { FormEvent } from "react";

interface MessageFormProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: FormEvent) => void;
  handleCancel: () => void;
  isLoading: boolean;
}

export default function MessageForm({
  input,
  setInput,
  handleSubmit,
  handleCancel,
  isLoading,
}: MessageFormProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-all duration-200"
        placeholder="Type your message..."
        disabled={isLoading}
      />
      {isLoading ? (
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
        >
          Cancel
        </button>
      ) : (
        <button
          type="submit"
          className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
        >
          Send
        </button>
      )}
    </form>
  );
}
