"use client";

import { toast } from "sonner";
import { createContext, useCallback, useContext } from "react";

type NotifyType = "success" | "error";

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
  const notify = useCallback((type: NotifyType, message: string) => {
    if (type === "success") toast.success(message);
    else toast.error(message);
  }, []);

  const success = useCallback((message: string) => toast.success(message), []);
  const error = useCallback((message: string) => toast.error(message), []);

  return (
    <NotifyContext.Provider value={{ notify, success, error }}>
      {children}
    </NotifyContext.Provider>
  );
}

