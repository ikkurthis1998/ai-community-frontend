"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface Toast {
  id: number;
  message: string;
  type: "error" | "success" | "info";
}

interface ToastContextType {
  showToast: (message: string, type: Toast["type"]) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  return (
    <>
      <ToastContext.Provider value={{ showToast, toasts }}>
        {children}
      </ToastContext.Provider>

      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              backgroundColor:
                toast.type === "error"
                  ? "#ef4444"
                  : toast.type === "success"
                    ? "#22c55e"
                    : "#3b82f6",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: "300px",
              animation: "slideIn 0.3s ease-out forwards",
            }}
          >
            <span>
              {toast.type === "error"
                ? "❌"
                : toast.type === "success"
                  ? "✅"
                  : "ℹ️"}
            </span>
            <p style={{ margin: 0, fontSize: "14px" }}>{toast.message}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
