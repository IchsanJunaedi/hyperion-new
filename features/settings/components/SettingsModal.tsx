"use client";

import { useEffect, useState } from "react";
import { Bell, Building2, Shield, User, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { NotifSection } from "./sections/NotifSection";
import { OrgSection } from "./sections/OrgSection";
import { ProfileSection } from "./sections/ProfileSection";
import { SecuritySection } from "./sections/SecuritySection";

type Tab = "profile" | "org" | "notif" | "security";

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  orgId: string;
  role: string;
}

const NAV_ITEMS: {
  key: Tab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "profile", label: "Profil", Icon: User },
  { key: "org", label: "Organisasi", Icon: Building2 },
  { key: "notif", label: "Notifikasi", Icon: Bell },
  { key: "security", label: "Keamanan", Icon: Shield },
];

const SECTION_LABELS: Record<Tab, string> = {
  profile: "Profil Saya",
  org: "Organisasi",
  notif: "Preferensi Notifikasi",
  security: "Keamanan Akun",
};

export function SettingsModal({
  open,
  onClose,
  userId,
  orgId,
  role,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("profile");

  const showOrg = role === "owner" || role === "manager";
  const visibleNav = NAV_ITEMS.filter((n) => n.key !== "org" || showOrg);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full max-w-3xl flex-col rounded-lg border border-[#2D2D2D] bg-[#202020] shadow-2xl"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#2D2D2D] px-6 py-4">
          <p className="text-sm font-semibold text-[#D4D4D4]">Settings</p>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#6B6A68] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left nav */}
          <nav className="w-48 shrink-0 space-y-0.5 border-r border-[#2D2D2D] p-2">
            {visibleNav.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded px-3 py-1.5 text-left text-sm transition",
                  tab === item.key
                    ? "bg-[#2C2C2C] font-medium text-[#D4D4D4]"
                    : "text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#D4D4D4]",
                )}
              >
                <item.Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="mb-6 text-base font-semibold text-[#D4D4D4]">
              {SECTION_LABELS[tab]}
            </h2>
            {tab === "profile" && <ProfileSection userId={userId} />}
            {tab === "org" && showOrg && (
              <OrgSection orgId={orgId} isOwner={role === "owner"} />
            )}
            {tab === "notif" && <NotifSection orgId={orgId} />}
            {tab === "security" && <SecuritySection />}
          </div>
        </div>
      </div>
    </div>
  );
}
