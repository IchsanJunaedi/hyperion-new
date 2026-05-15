"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type NotifyType = "success" | "error";

interface NotifyState {
  open: boolean;
  type: NotifyType;
  message: string;
}

interface NotifyContextValue {
  notify: (type: NotifyType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const NotifyContext = createContext<NotifyContextValue>({
  notify: () => {},
  success: () => {},
  error: () => {},
});

export function useNotify() {
  return useContext(NotifyContext);
}

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NotifyState>({ open: false, type: "success", message: "" });

  const notify = useCallback((type: NotifyType, message: string) => {
    setState({ open: true, type, message });
    setTimeout(() => setState((s) => ({ ...s, open: false })), 2500);
  }, []);

  const success = useCallback((message: string) => notify("success", message), [notify]);
  const error = useCallback((message: string) => notify("error", message), [notify]);

  return (
    <NotifyContext.Provider value={{ notify, success, error }}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setState((s) => ({ ...s, open: false }))}
        >
          <div
            className="bg-[#202020] border border-[#2D2D2D] rounded-xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {state.type === "success" ? (
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            ) : (
              <XCircle className="h-10 w-10 text-red-400" />
            )}
            <p className="text-sm text-[#E5E2E1] text-center font-medium">
              {state.message}
            </p>
          </div>
        </div>
      )}
    </NotifyContext.Provider>
  );
}
