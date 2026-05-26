"use client";

import { useState } from "react";
import { NumberInput } from "@/components/ui/number-input";
import { X } from "lucide-react";
import { toast } from "sonner";

const INPUT_CLASS =
  "mt-1.5 w-full border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#F5C400]/50 focus:ring-0";

export function JoinModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setOpen(false);
    toast.success("Terima kasih! Kami akan menghubungi kamu segera.");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex h-14 cursor-pointer items-center gap-3 bg-[#F5C400] px-8 text-sm font-black uppercase tracking-wide text-black transition hover:bg-yellow-300"
      >
        Join Now
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-md border border-white/10 bg-[#0D0D0D] p-8">
            {/* Close */}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center text-white/30 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              Join With Hyperion
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/40">
              Unleash Young Potential Power. Focus of Develop Young Player.
            </p>

            {/* Form */}
            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                  Full Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Ahmad Rizky"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                  Age
                </label>
                <NumberInput
                  name="age"
                  min={10}
                  max={25}
                  required
                  placeholder="e.g. 16"
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder-white/20 focus:border-[#F5C400]/50 h-10 mt-1.5"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                  School / Asal Sekolah
                </label>
                <input
                  name="school"
                  required
                  placeholder="e.g. SMA Negeri 1 Palembang"
                  className={INPUT_CLASS}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full cursor-pointer bg-[#F5C400] py-3 text-sm font-black uppercase tracking-wide text-black transition hover:bg-yellow-300 disabled:opacity-60"
              >
                {loading ? "Submitting…" : "Submit →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
