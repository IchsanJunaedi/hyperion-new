"use client";

import { CalendarCheck2, Loader2, Minus, Plus } from "lucide-react";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createPollAction, createAvailabilityPollAction } from "@/features/polls/actions";
import { cn } from "@/lib/utils/cn";

interface CreatePollFormProps {
  orgSlug: string;
  onDone?: () => void;
}

export function CreatePollForm({ orgSlug, onDone }: CreatePollFormProps) {
  const [pollType, setPollType] = useState<"regular" | "availability">("regular");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [slots, setSlots] = useState(["", ""]);
  const [expiresAt, setExpiresAt] = useState("");
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  function addOption() {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  function addSlot() {
    if (slots.length >= 20) return;
    setSlots([...slots, ""]);
  }

  function removeSlot(index: number) {
    if (slots.length <= 1) return;
    setSlots(slots.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, value: string) {
    const updated = [...slots];
    updated[index] = value;
    setSlots(updated);
  }

  function handleSubmit() {
    if (pollType === "regular") {
      const validOptions = options.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        error("Minimal 2 opsi yang terisi");
        return;
      }
      startTransition(async () => {
        const res = await createPollAction(orgSlug, {
          question,
          options: validOptions,
          expires_at: expiresAt || undefined,
        });
        if (res.ok) {
          success("Poll dibuat!");
          resetForm();
        } else {
          error(res.message);
        }
      });
    } else {
      const validSlots = slots.filter((s) => s.trim().length > 0);
      if (validSlots.length < 1) {
        error("Minimal 1 slot waktu yang terisi");
        return;
      }
      const isoSlots = validSlots.map((s) => new Date(s).toISOString());
      startTransition(async () => {
        const res = await createAvailabilityPollAction(orgSlug, {
          question,
          availability_slots: isoSlots,
          expires_at: expiresAt || undefined,
        });
        if (res.ok) {
          success("Poll jadwal dibuat!");
          resetForm();
        } else {
          error(res.message);
        }
      });
    }
  }

  function resetForm() {
    setQuestion("");
    setOptions(["", ""]);
    setSlots(["", ""]);
    setExpiresAt("");
    onDone?.();
  }

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4 space-y-3">
      {/* Type toggle */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setPollType("regular")}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition cursor-pointer border",
            pollType === "regular"
              ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
              : "border-[#2D2D2D] text-[#6B6A68] hover:text-[#9B9A97]",
          )}
        >
          Poll Biasa
        </button>
        <button
          type="button"
          onClick={() => setPollType("availability")}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition cursor-pointer border",
            pollType === "availability"
              ? "border-teal-500/50 bg-teal-500/10 text-teal-400"
              : "border-[#2D2D2D] text-[#6B6A68] hover:text-[#9B9A97]",
          )}
        >
          <CalendarCheck2 className="h-3 w-3" />
          Jadwal (Availability)
        </button>
      </div>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={pollType === "availability" ? "Siapa bisa kapan? (e.g. Scrim minggu ini)" : "Pertanyaan poll..."}
        maxLength={500}
        className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
      />

      {pollType === "regular" ? (
        <div className="space-y-2">
          <label className="text-xs text-[#9B9A97]">Opsi jawaban</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Opsi ${i + 1}`}
                className="h-8 flex-1 rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-xs text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="h-8 w-8 rounded-md border border-[#2D2D2D] grid place-items-center text-[#6B6A68] hover:text-red-400 hover:border-red-400/30 cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-1 text-xs text-[#9B9A97] hover:text-[#E5E2E1] cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              Tambah opsi
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs text-[#9B9A97]">Slot waktu</label>
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={slot}
                onChange={(e) => updateSlot(i, e.target.value)}
                className="h-8 flex-1 rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-xs text-[#E5E2E1] focus:border-teal-400/50 focus:outline-none"
              />
              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="h-8 w-8 rounded-md border border-[#2D2D2D] grid place-items-center text-[#6B6A68] hover:text-red-400 hover:border-red-400/30 cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {slots.length < 20 && (
            <button
              type="button"
              onClick={addSlot}
              className="inline-flex items-center gap-1 text-xs text-[#9B9A97] hover:text-[#E5E2E1] cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              Tambah slot
            </button>
          )}
        </div>
      )}

      <div>
        <label className="text-xs text-[#9B9A97] mb-1 block">Batas waktu (opsional)</label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="h-8 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-xs text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !question.trim()}
          onClick={handleSubmit}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md px-4 text-xs font-semibold disabled:opacity-50 cursor-pointer",
            pollType === "availability"
              ? "bg-teal-600 text-white hover:bg-teal-500"
              : "bg-yellow-400 text-black hover:bg-yellow-300",
          )}
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          Buat Poll
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
