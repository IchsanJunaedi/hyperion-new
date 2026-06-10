"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

const ThemedToaster = () => {
  const { theme, resolvedTheme } = useTheme();
  const active = (theme === "system" ? resolvedTheme : theme) ?? "dark";

  return (
    <Toaster
      theme={active === "light" ? "light" : "dark"}
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          color: "var(--ui-text)",
          borderRadius: "10px",
          fontSize: "13px",
          fontFamily: "var(--font-sans)",
        },
        classNames: {
          toast: "!bg-ui-surface !border-ui-border !text-ui-text !rounded-[10px] !shadow-xl",
          title: "!text-ui-text !font-medium",
          description: "!text-ui-text-2",
          actionButton: "!bg-ui-elevated !text-ui-text",
          cancelButton: "!bg-ui-elevated !text-ui-text-2",
          closeButton: "!bg-ui-elevated !border-ui-border !text-ui-text-2",
          success: "!border-l-2 !border-l-[#4ade80]/60",
          error: "!border-l-2 !border-l-[#f87171]/60",
          warning: "!border-l-2 !border-l-[#facc15]/60",
          info: "!border-l-2 !border-l-[#60a5fa]/60",
        },
      }}
    />
  );
};

export { ThemedToaster };
