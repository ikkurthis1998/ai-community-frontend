interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorMessage({
  message,
  onDismiss,
}: ErrorMessageProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onDismiss} className="ml-2 hover:text-red-200">
          ✕
        </button>
      </div>
    </div>
  );
}
