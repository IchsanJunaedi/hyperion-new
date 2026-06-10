"use client";

import Link from "next/link";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { toggleOrgPublicAction, updateOrgAction } from "../actions";
import { useNotify } from "./NotifyModal";

interface OrgSettingsCardProps {
  org: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    is_public: boolean;
  };
  divisions: Array<{
    id: string;
    name: string;
    slug: string;
    game: string;
    is_active: boolean;
  }>;
}

const OrgSettingsCard = ({ org, divisions }: OrgSettingsCardProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toggling, startToggle] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(org.name);
  const [isPublic, setIsPublic] = useState(org.is_public);
  const { success, error: notifyError } = useNotify();

  function handleTogglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    startToggle(async () => {
      const res = await toggleOrgPublicAction(org.id, next);
      if (res.ok) {
        success(next ? "Profil publik diaktifkan" : "Profil publik dinonaktifkan");
        router.refresh();
      } else {
        setIsPublic(!next);
        notifyError(res.message);
      }
    });
  }

  function handleSave() {
    if (!editName.trim() || editName.trim() === org.name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await updateOrgAction(org.id, { name: editName.trim(), tier: "komunitas", logo_url: org.logo_url });
      if (res.ok) {
        success("Nama tim diubah");
        setEditing(false);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  return (
    <div className="border border-[#2D2D2D] rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {editing ? (
          <div className="flex items-center gap-2 flex-1 mr-4">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 flex-1 rounded border border-[#2D2D2D] bg-[#191919] px-3 text-sm font-semibold text-[#E5E2E1] focus:border-[#D4D4D4] focus:outline-none"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            />
            <button onClick={handleSave} disabled={pending} className="p-1.5 text-green-400 hover:bg-[#2C2C2C] rounded">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </button>
            <button onClick={() => { setEditing(false); setEditName(org.name); }} className="p-1.5 text-[#9B9A97] hover:bg-[#2C2C2C] rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-[#E5E2E1]">{org.name}</h3>
              <span className="text-xs text-[#6B6A68]">/{org.slug}</span>
              <button onClick={() => setEditing(true)} className="p-1 text-[#9B9A97] hover:text-[#D4D4D4] hover:bg-[#2C2C2C] rounded cursor-pointer">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <Link
              href={`/${org.slug}`}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-white/10 hover:bg-white/15 px-3 text-xs font-medium text-[#E5E2E1] transition-colors cursor-pointer"
            >
              Buka Workspace
            </Link>
          </>
        )}
      </div>

      {/* Public Profile Toggle */}
      <div className="flex items-center justify-between py-3 border-t border-[#2D2D2D]">
        <div>
          <p className="text-sm text-[#D4D4D4]">Profil Publik</p>
          <p className="text-xs text-[#6B6A68]">
            {isPublic ? (
              <span>
                Aktif ·{" "}
                <a
                  href={`/p/${org.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  /p/{org.slug}
                </a>
              </span>
            ) : "Nonaktif — hanya anggota tim yang bisa melihat"}
          </p>
        </div>
        <button
          onClick={handleTogglePublic}
          disabled={toggling}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${isPublic ? "bg-emerald-500" : "bg-[#2D2D2D]"}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isPublic ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </button>
      </div>

      {/* Divisions */}
      <div>
        <p className="text-xs text-[#6B6A68] mb-2">Divisi</p>
        {divisions.length === 0 ? (
          <p className="text-sm text-[#6B6A68]">Belum ada divisi</p>
        ) : (
          <div className="flex flex-col gap-1">
            {divisions.map((div) => (
              <div
                key={div.id}
                className="flex items-center justify-between py-1.5 px-3 -mx-3 hover:bg-[#2C2C2C] rounded transition-colors"
              >
                <span className="text-sm text-[#D4D4D4]">{div.name}</span>
                {!div.is_active && (
                  <span className="text-[10px] text-[#6B6A68] bg-[#2C2C2C] px-1.5 py-0.5 rounded">Arsip</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export { OrgSettingsCard };
