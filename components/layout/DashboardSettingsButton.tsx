"use client";

import { useState } from "react";
import { Settings } from "lucide-react";

import { SettingsModal } from "@/features/settings/components/SettingsModal";

interface DashboardSettingsButtonProps {
  userId: string;
  orgId: string;
}

const DashboardSettingsButton = ({
  userId,
  orgId,
}: DashboardSettingsButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-1.5 text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text-dim"
      >
        <Settings className="h-[18px] w-[18px]" />
        <span>Settings</span>
      </button>
      <SettingsModal
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
        orgId={orgId}
        role="owner"
      />
    </>
  );
};
export { DashboardSettingsButton };
