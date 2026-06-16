"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { NumberInput } from "@/components/ui/number-input";
import { updatePlayerProfileAction } from "@/features/admin/actions";

interface EditPlayerModalProps {
  member: {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    role: string;
    position: string | null;
    jersey_number: number | null;
    is_public: boolean;
  };
  onClose: () => void;
  onSuccess: (updated: {
    display_name: string;
    avatar_url: string | null;
    is_public: boolean;
    jersey_number: number | null;
    position: string | null;
  }) => void;
}

const EditPlayerModal = ({ member, onClose, onSuccess }: EditPlayerModalProps) => {
  const [displayName, setDisplayName] = useState(member.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member.avatar_url);
  const [position, setPosition] = useState(member.position ?? "");
  const [jerseyNumberStr, setJerseyNumberStr] = useState(
    member.jersey_number != null ? String(member.jersey_number) : ""
  );
  const [isPublic, setIsPublic] = useState(member.is_public);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!displayName.trim()) {
      toast.error("Nama player harus diisi");
      return;
    }

    const jerseyNumber = jerseyNumberStr !== "" ? parseInt(jerseyNumberStr, 10) : null;
    if (jerseyNumber !== null && isNaN(jerseyNumber)) {
      toast.error("Nomor jersey tidak valid");
      return;
    }

    startTransition(async () => {
      const result = await updatePlayerProfileAction(member.id, member.user_id, {
        display_name: displayName,
        avatar_url: avatarUrl,
        is_public: isPublic,
        jersey_number: jerseyNumber,
        position: position,
      });

      if (!result.ok) {
        toast.error(result.message);
      } else {
        toast.success("Data player berhasil disimpan");
        onSuccess({
          display_name: displayName,
          avatar_url: avatarUrl,
          is_public: isPublic,
          jersey_number: jerseyNumber,
          position: position || null,
        });
        onClose();
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-ui-border bg-[#191919] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ui-border pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-ui-text-dim">Edit Player</h2>
            <p className="text-xs text-ui-text-muted capitalize">Role: {member.role}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded p-1 text-ui-text-muted hover:bg-ui-hover hover:text-ui-text-dim transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <ImageUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              folder={`avatars/${member.user_id}`}
              label="Foto Profil Player"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ui-text-2">
              Nama Player
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text placeholder-ui-text-muted focus:border-[#F5C400]/50 focus:outline-none"
              placeholder="Display Name"
            />
          </div>

          {/* Jersey Number & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ui-text-2">
                Nomor Jersey
              </label>
              <NumberInput
                value={jerseyNumberStr}
                onChange={(e) => setJerseyNumberStr(e.target.value)}
                placeholder="Jersey #"
                min={0}
                max={999}
                hideSteppers
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ui-text-2">
                Posisi / Role Game
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text placeholder-ui-text-muted focus:border-[#F5C400]/50 focus:outline-none"
                placeholder="e.g. Roamer, Jungler"
              />
            </div>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between border-t border-ui-border pt-4 mt-2">
            <div>
              <p className="text-sm font-semibold text-ui-text-dim">Tampilkan Publik</p>
              <p className="text-xs text-ui-text-muted">
                Tampilkan kartu player ini di halaman roster.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
                isPublic ? "bg-[#F5C400]" : "bg-ui-border"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  isPublic ? "translate-x-[18px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-ui-border pt-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded border border-ui-border px-4 py-2 text-xs font-semibold text-ui-text-2 hover:bg-ui-hover transition"
            disabled={isPending}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="cursor-pointer rounded bg-[#F5C400] px-4 py-2 text-xs font-bold text-black hover:bg-yellow-300 transition disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export { EditPlayerModal };
