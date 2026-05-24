"use client";

import { CheckCircle2, ChevronDown, Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { registerApplicantAction } from "@/features/trials/actions";
import type { getTrialByToken } from "@/features/trials/queries";
import { cn } from "@/lib/utils/cn";

type TrialPublic = NonNullable<Awaited<ReturnType<typeof getTrialByToken>>>;

const inputCls = "h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none";

function AgeInput() {
  const [age, setAge] = useState(17);
  const dec = () => setAge((v) => Math.max(10, v - 1));
  const inc = () => setAge((v) => Math.min(99, v + 1));

  return (
    <div className="flex h-10 items-center rounded-md border border-[#2D2D2D] bg-[#191919] overflow-hidden">
      <button
        type="button"
        onClick={dec}
        className="flex h-full w-10 items-center justify-center text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#E5E2E1] transition cursor-pointer text-lg font-light select-none"
      >
        −
      </button>
      <span className="flex-1 text-center text-sm font-semibold text-[#E5E2E1] select-none">
        {age}
      </span>
      <button
        type="button"
        onClick={inc}
        className="flex h-full w-10 items-center justify-center text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#E5E2E1] transition cursor-pointer text-lg font-light select-none"
      >
        +
      </button>
      <input type="hidden" name="age" value={age} />
    </div>
  );
}

function RoleDropdown({
  positions,
  value,
  onChange,
}: {
  positions: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-full flex items-center justify-between rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none cursor-pointer"
      >
        <span className={value ? "text-[#E5E2E1]" : "text-[#6B6A68]"}>
          {value || "— Pilih posisi —"}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[#6B6A68] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-[#2D2D2D] bg-[#202020] py-1 shadow-xl scroll-premium max-h-48 overflow-y-auto">
          {positions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { onChange(p); setOpen(false); }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#E5E2E1] hover:bg-[#2C2C2C] cursor-pointer"
            >
              {p}
              {value === p && <Check className="h-3.5 w-3.5 text-[#9B9A97]" />}
            </button>
          ))}
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name="role_applied" value={value} />
    </div>
  );
}

export function TrialRegistrationForm({ trial }: { trial: TrialPublic }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isFreeAgent, setIsFreeAgent] = useState(true);
  const [roleApplied, setRoleApplied] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (trial.positions.length > 0 && !roleApplied) {
      setErr("Pilih posisi yang dilamar terlebih dahulu.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setErr(null);
      const res = await registerApplicantAction({
        trial_id: trial.id,
        name: fd.get("name"),
        ign: fd.get("ign"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        role_applied: roleApplied,
        rank: fd.get("rank"),
        server: null,
        main_game: trial.game,
        secondary_game: null,
        is_free_agent: isFreeAgent,
        age: fd.get("age"),
        social_media: fd.get("social_media"),
      });
      if (res.ok) setDone(true);
      else setErr(res.message);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" />
        <p className="mt-4 text-base font-semibold text-[#E5E2E1]">Pendaftaran berhasil!</p>
        <p className="mt-1 text-sm text-[#9B9A97]">
          Cek WhatsApp kamu untuk konfirmasi. Tim akan menghubungi setelah seleksi.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-6 space-y-6">
      <div>
        <p className="text-xs text-[#9B9A97] uppercase tracking-wide">{trial.org_name}</p>
        <h1 className="mt-1 text-xl font-bold text-[#E5E2E1]">{trial.title}</h1>
        <p className="text-sm text-[#9B9A97]">{trial.game}</p>
        {trial.positions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {trial.positions.map((p) => (
              <span key={p} className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-xs text-[#9B9A97]">{p}</span>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="name" className="block text-xs text-[#9B9A97] mb-1">Nama Lengkap <span className="text-red-400">*</span></label>
            <input id="name" name="name" type="text" required className={inputCls} />
          </div>
          <div>
            <label htmlFor="ign" className="block text-xs text-[#9B9A97] mb-1">Username <span className="text-red-400">*</span></label>
            <input id="ign" name="ign" type="text" required className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="phone" className="block text-xs text-[#9B9A97] mb-1">No. WhatsApp <span className="text-red-400">*</span></label>
            <input id="phone" name="phone" type="tel" required className={inputCls} />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs text-[#9B9A97] mb-1">Email <span className="text-red-400">*</span></label>
            <input id="email" name="email" type="email" required className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Umur <span className="text-red-400">*</span></label>
            <AgeInput />
          </div>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Role / Posisi Dilamar <span className="text-red-400">*</span></label>
            {trial.positions.length > 0 ? (
              <RoleDropdown positions={trial.positions} value={roleApplied} onChange={setRoleApplied} />
            ) : (
              <input
                id="role_applied"
                type="text"
                required
                value={roleApplied}
                onChange={(e) => setRoleApplied(e.target.value)}
                className={inputCls}
              />
            )}
          </div>
        </div>

        <div>
          <label htmlFor="rank" className="block text-xs text-[#9B9A97] mb-1">Rank Saat Ini <span className="text-red-400">*</span></label>
          <input id="rank" name="rank" type="text" required className={inputCls} />
        </div>

        <div>
          <label htmlFor="social_media" className="block text-xs text-[#9B9A97] mb-1">Sosial Media <span className="text-red-400">*</span></label>
          <input id="social_media" name="social_media" type="text" required className={inputCls} />
        </div>

        {/* Free agent toggle */}
        <div className="flex items-center justify-between rounded-lg border border-[#2D2D2D] bg-[#191919] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#E5E2E1]">Status</p>
            <p className="text-xs text-[#9B9A97]">{isFreeAgent ? "Free agent / tidak di tim manapun" : "Masih tergabung di tim lain"}</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" className="sr-only" checked={isFreeAgent} onChange={(e) => setIsFreeAgent(e.target.checked)} />
            <div className={cn("h-5 w-9 rounded-full transition-colors", isFreeAgent ? "bg-green-500" : "bg-[#2D2D2D]")}>
              <div className={cn("h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform", isFreeAgent ? "translate-x-[18px]" : "translate-x-0.5")} />
            </div>
          </label>
        </div>

        {err && (
          <p className="text-xs text-red-400 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">{err}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#E5E2E1] text-sm font-semibold text-[#191919] hover:bg-white disabled:opacity-50 cursor-pointer"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Daftar Sekarang
        </button>
      </form>
    </div>
  );
}
