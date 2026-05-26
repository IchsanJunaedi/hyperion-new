"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { CustomSelect } from "@/features/dashboard/components/CustomSelect";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { NumberInput } from "@/components/ui/number-input";
import { createPlayerTargetAction } from "@/features/player-development/actions";

interface AddTargetFormProps {
  orgSlug: string;
  members: Array<{ user_id: string; display_name: string | null }>;
  onDone?: () => void;
}

export function AddTargetForm({ orgSlug, members, onDone }: AddTargetFormProps) {
  const [userId, setUserId] = useState(members[0]?.user_id ?? "");
  const [skillName, setSkillName] = useState("");
  const [targetLevel, setTargetLevel] = useState(5);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  function handleSubmit() {
    startTransition(async () => {
      const res = await createPlayerTargetAction(orgSlug, {
        user_id: userId,
        skill_name: skillName,
        target_level: targetLevel,
        current_level: currentLevel,
        notes: notes || undefined,
      });
      if (res.ok) {
        success("Target ditambahkan!");
        setSkillName("");
        setNotes("");
        onDone?.();
      } else {
        error(res.message);
      }
    });
  }

  return (
    <div className="rounded-lg border border-[#2D2D2D] bg-[#202020] p-4 space-y-3">
      <div>
        <label className="text-xs text-[#9B9A97] mb-1 block">Player</label>
        <CustomSelect
          value={userId}
          options={members.map((m) => ({
            value: m.user_id,
            label: m.display_name ?? "Unknown",
          }))}
          onChange={setUserId}
        />
      </div>

      <div>
        <label className="text-xs text-[#9B9A97] mb-1 block">Nama Skill</label>
        <input
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          placeholder="Contoh: Map Awareness, Mechanical Skill"
          className="h-8 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-xs text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#9B9A97] mb-1 block">Level Sekarang (1-10)</label>
          <NumberInput
            min={1}
            max={10}
            value={currentLevel}
            onChange={(e) => setCurrentLevel(Number(e.target.value))}
            className="h-8 text-xs focus:border-yellow-400/50"
          />
        </div>
        <div>
          <label className="text-xs text-[#9B9A97] mb-1 block">Target Level (1-10)</label>
          <NumberInput
            min={1}
            max={10}
            value={targetLevel}
            onChange={(e) => setTargetLevel(Number(e.target.value))}
            className="h-8 text-xs focus:border-yellow-400/50"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-[#9B9A97] mb-1 block">Catatan (opsional)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-8 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-xs text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !skillName || !userId}
          onClick={handleSubmit}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          Tambah Target
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="h-8 rounded-md border border-[#2D2D2D] px-3 text-xs text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
          >
            Batal
          </button>
        )}
      </div>
    </div>
  );
}
