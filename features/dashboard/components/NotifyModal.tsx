"use client";

import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type NotifyType = "success" | "error" | "warning" | "info";

interface NotifyState {
  open: boolean;
  type: NotifyType;
  message: string;
  key: number;
}

// ── Global event emitter (no React context needed) ─────────────────────────
type Listener = (type: NotifyType, message: string) => void;
const _listeners: Listener[] = [];

function _emit(type: NotifyType, message: string) {
  _listeners.forEach((l) => l(type, message));
}

// ── Public API — drop-in replacement for sonner's `toast` ─────────────────
export const notify = {
  success: (message: string) => _emit("success", message),
  error:   (message: string) => _emit("error",   message),
  warning: (message: string) => _emit("warning", message),
  info:    (message: string) => _emit("info",    message),
};

// ── Backward-compat hook (for components already using useNotify) ──────────
export function useNotify() {
  return {
    notify: (type: NotifyType, message: string) => _emit(type, message),
    success: (message: string) => _emit("success", message),
    error:   (message: string) => _emit("error",   message),
  };
}

// ── Icon map ──────────────────────────────────────────────────────────────
const ICON: Record<NotifyType, React.ReactNode> = {
  success: <CheckCircle2 className="h-10 w-10 text-emerald-400" />,
  error:   <XCircle     className="h-10 w-10 text-rose-400"    />,
  warning: <AlertTriangle className="h-10 w-10 text-yellow-400" />,
  info:    <Info        className="h-10 w-10 text-blue-400"    />,
};

// ── Provider — mount once at root layout ──────────────────────────────────
export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NotifyState>({
    open: false, type: "success", message: "", key: 0,
  });

  useEffect(() => {
    const listener: Listener = (type, message) => {
      setState((s) => ({ open: true, type, message, key: s.key + 1 }));
    };
    _listeners.push(listener);
    return () => {
      const i = _listeners.indexOf(listener);
      if (i > -1) _listeners.splice(i, 1);
    };
  }, []);

  // Auto-close after 2500ms, reset when new toast comes in
  useEffect(() => {
    if (!state.open) return;
    const t = setTimeout(() => setState((s) => ({ ...s, open: false })), 2500);
    return () => clearTimeout(t);
  }, [state.open, state.key]);

  return (
    <>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setState((s) => ({ ...s, open: false }))}
        >
          <div
            className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl px-8 py-7 flex flex-col items-center gap-3 shadow-2xl max-w-xs w-full mx-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {ICON[state.type]}
            <p className="text-sm text-[#E5E2E1] text-center font-medium leading-relaxed">
              {state.message}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

