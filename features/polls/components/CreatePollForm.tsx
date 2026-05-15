"use client";

import { Loader2, Minus, Plus } from "lucide-react";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createPollAction } from "@/features/polls/actions";

interface CreatePollFormProps {
  orgSlug: string;
  onDone?: () => void;
}

export function CreatePollForm({ orgSlug, onDone }: CreatePollFormProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
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

  function handleSubmit() {
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
        setQuestion("");
        setOptions(["", ""]);
        setExpiresAt("");
        onDone?.();
      } else {
        error(res.message);
      }
    });
  }

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4 space-y-3">
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Pertanyaan poll..."
        maxLength={500}
        className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
      />

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
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
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
