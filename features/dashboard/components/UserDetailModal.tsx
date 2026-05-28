"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export interface UserDetail {
  id: string;
  fullName: string | null;
  username: string | null;
  email: string | null;
  phoneWa: string | null;
  dateOfBirth: string | null;
  bio: string | null;
  socialLinks: Record<string, string> | null;
  gameIds: Record<string, string> | null;
  role: string | null;
  division: string | null;
  orgName: string | null;
}

interface UserDetailModalProps {
  user: UserDetail | null;
  onClose: () => void;
}

const UserDetailModal = ({ user, onClose }: UserDetailModalProps) => {
  useEffect(() => {
    if (!user) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [user, onClose]);

  if (!user) return null;

  const socials = user.socialLinks ?? {};
  const games = user.gameIds ?? {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {user.fullName ?? user.username ?? "—"}
            </h3>
            {user.username && <p className="text-xs text-white/50">@{user.username}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="Email" value={user.email} />
          <Row label="WhatsApp" value={user.phoneWa} />
          <Row label="Tanggal Lahir" value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("id-ID") : null} />
          <Row label="Role" value={user.role ?? "none"} />
          <Row label="Tim" value={user.orgName} />
          <Row label="Divisi" value={user.division} />

          {user.bio && (
            <div>
              <p className="text-xs text-white/50">Bio</p>
              <p className="mt-0.5 text-white/80 whitespace-pre-line">{user.bio}</p>
            </div>
          )}

          {Object.keys(socials).length > 0 && (
            <div>
              <p className="text-xs text-white/50 mb-1">Sosial Media</p>
              <div className="space-y-1">
                {Object.entries(socials).map(([key, val]) => val && (
                  <div key={key} className="flex gap-2 text-xs">
                    <span className="capitalize text-white/50 w-20">{key}:</span>
                    <span className="text-white/80 truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(games).length > 0 && (
            <div>
              <p className="text-xs text-white/50 mb-1">Game ID</p>
              <div className="space-y-1">
                {Object.entries(games).map(([key, val]) => val && (
                  <div key={key} className="flex gap-2 text-xs">
                    <span className="uppercase text-white/50 w-20">{key}:</span>
                    <span className="text-white/80">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export { UserDetailModal };

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-0.5 text-white/80">{value ?? "—"}</p>
    </div>
  );
}
