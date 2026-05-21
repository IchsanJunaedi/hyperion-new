"use client";

import Link from "next/link";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateOrgAction } from "../actions";
import { useNotify } from "./NotifyModal";

interface OrgSettingsCardProps {
  org: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  divisions: Array<{
    id: string;
    name: string;
    slug: string;
    game: string;
    is_active: boolean;
  }>;
}

export function OrgSettingsCard({ org, divisions }: OrgSettingsCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(org.name);
  const { success, error: notifyError } = useNotify();

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
}
