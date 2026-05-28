"use client";

import { Check, CheckCircle2, ChevronDown, FileUp, ImageUp, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { registerApplicantAction } from "@/features/trials/actions";
import type { getTrialByToken } from "@/features/trials/queries";
import { cn } from "@/lib/utils/cn";

type TrialPublic = NonNullable<Awaited<ReturnType<typeof getTrialByToken>>>;

const inputCls =
  "h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none";

// ─── RoleDropdown ─────────────────────────────────────────────────────────────

const RoleDropdown = ({
  positions,
  value,
  onChange,
}: {
  positions: string[];
  value: string;
  onChange: (v: string) => void;
}) => {
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
        className="h-10 w-full flex items-center justify-between rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] cursor-pointer"
      >
        <span className={value ? "text-[#E5E2E1]" : "text-[#6B6A68]"}>
          {value || "— Pilih posisi —"}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[#6B6A68] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-[#2D2D2D] bg-[#202020] py-1 shadow-xl max-h-48 overflow-y-auto">
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
      <input type="hidden" name="role_applied" value={value} />
    </div>
  );
};

// ─── HeroTagsInput ────────────────────────────────────────────────────────────

const HeroTagsInput = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) => {
  const [input, setInput] = useState("");

  function add() {
    const val = input.trim();
    if (val && !value.includes(val)) onChange([...value, val]);
    setInput("");
  }

  return (
    <div className="rounded-md border border-[#2D2D2D] bg-[#191919] px-3 py-2 min-h-[40px] flex flex-wrap gap-1.5">
      {value.map((h) => (
        <span
          key={h}
          className="inline-flex items-center gap-1 rounded-full border border-[#2D2D2D] bg-[#2C2C2C] px-2 py-0.5 text-xs text-[#D4D4D4]"
        >
          {h}
          <button
            type="button"
            onClick={() => onChange(value.filter((x) => x !== h))}
            className="text-[#6B6A68] hover:text-[#E5E2E1] cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "," || e.key === " ") { e.preventDefault(); add(); }
          if (e.key === "Backspace" && !input && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={value.length === 0 ? "Ketik nama hero, tekan Enter atau Spasi" : ""}
        className="flex-1 min-w-24 bg-transparent text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:outline-none"
      />
    </div>
  );
};

// ─── TrialRegistrationForm ────────────────────────────────────────────────────

const TrialRegistrationForm = ({ trial }: { trial: TrialPublic }) => {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [isFreeAgent, setIsFreeAgent] = useState(true);
  const [roleApplied, setRoleApplied] = useState("");
  const [heroPool, setHeroPool] = useState<string[]>([]);

  // MLBB nickname check
  const [gameUserId, setGameUserId] = useState("");
  const [gameZoneId, setGameZoneId] = useState("");
  const [gameNickname, setGameNickname] = useState<string | null>(null);
  const [checkingNick, setCheckingNick] = useState(false);

  // Screenshot upload
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CV upload
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadCvErr, setUploadCvErr] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  async function handleNickCheck() {
    if (!gameUserId || !gameZoneId) return;
    setCheckingNick(true);
    setGameNickname(null);
    try {
      const res = await fetch(`/api/mlbb/nickname?userId=${gameUserId}&zoneId=${gameZoneId}`);
      const json = await res.json() as { nickname: string | null };
      setGameNickname(json.nickname ?? "Tidak ditemukan");
    } catch {
      setGameNickname("Tidak ditemukan");
    } finally {
      setCheckingNick(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setUploadErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("trialId", trial.id);
      const res = await fetch("/api/trials/upload-screenshot", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) {
        setScreenshotUrl(json.url);
      } else {
        setUploadErr(json.error ?? "Upload gagal");
        setScreenshotFile(null);
      }
    } catch {
      setUploadErr("Upload gagal, coba lagi");
      setScreenshotFile(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvFile(file);
    setUploadCvErr(null);
    setUploadingCv(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("trialId", trial.id);
      const res = await fetch("/api/trials/upload-cv", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) {
        setCvUrl(json.url);
      } else {
        setUploadCvErr(json.error ?? "Upload gagal");
        setCvFile(null);
      }
    } catch {
      setUploadCvErr("Upload gagal, coba lagi");
      setCvFile(null);
    } finally {
      setUploadingCv(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (trial.positions.length > 0 && !roleApplied) {
      setErr("Pilih posisi yang dilamar terlebih dahulu.");
      return;
    }
    if (!screenshotUrl) {
      setErr("Screenshot profil wajib diupload.");
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
        city: fd.get("city"),
        game_id: gameUserId && gameZoneId ? `${gameUserId} (${gameZoneId})` : null,
        game_nickname: gameNickname,
        win_rate: fd.get("win_rate"),
        hero_pool: heroPool,
        competitive_exp: fd.get("competitive_exp"),
        screenshot_url: screenshotUrl,
        cv_url: cvUrl,
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
      {/* Trial header */}
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

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Data Pribadi ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">Data Pribadi</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">Nama Lengkap <span className="text-red-400">*</span></label>
                <input name="name" type="text" required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">Username <span className="text-red-400">*</span></label>
                <input name="ign" type="text" required className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">No. WhatsApp <span className="text-red-400">*</span></label>
                <input
                  name="phone" type="tel" inputMode="numeric" maxLength={15} required
                  className={inputCls}
                  onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""); }}
                />
              </div>
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">Email <span className="text-red-400">*</span></label>
                <input name="email" type="email" required className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">Umur <span className="text-red-400">*</span></label>
                <input
                  name="age" type="text" inputMode="numeric" required
                  maxLength={2}
                  className={inputCls}
                  onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""); }}
                />
              </div>
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">Kota Asal <span className="text-red-400">*</span></label>
                <input name="city" type="text" required className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Info Game ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">Info Game</p>
          <div className="space-y-3">
            {/* ID Game + Server + Cek Nick */}
            <div>
              <label className="block text-xs text-[#9B9A97] mb-1">
                ID Game &amp; Server
              </label>
              <div className="flex gap-2">
                <input
                  type="text" inputMode="numeric" placeholder="ID Game"
                  value={gameUserId}
                  onChange={(e) => { setGameUserId(e.target.value.replace(/\D/g, "")); setGameNickname(null); }}
                  className="h-10 flex-1 rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none"
                />
                <input
                  type="text" inputMode="numeric" placeholder="Server"
                  value={gameZoneId}
                  onChange={(e) => { setGameZoneId(e.target.value.replace(/\D/g, "")); setGameNickname(null); }}
                  className="h-10 w-24 rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!gameUserId || !gameZoneId || checkingNick}
                  onClick={handleNickCheck}
                  className="h-10 shrink-0 rounded-md border border-[#2D2D2D] px-3 text-xs text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#E5E2E1] disabled:opacity-40 cursor-pointer transition-colors"
                >
                  {checkingNick ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cek Nick"}
                </button>
              </div>
              {gameNickname !== null && (
                <p className={cn(
                  "mt-1.5 text-xs px-3 py-1.5 rounded-md",
                  gameNickname === "Tidak ditemukan"
                    ? "text-red-400 bg-red-500/10 border border-red-500/20"
                    : "text-green-400 bg-green-500/10 border border-green-500/20"
                )}>
                  {gameNickname === "Tidak ditemukan"
                    ? "ID/Server tidak ditemukan. Periksa kembali."
                    : `Terdeteksi: ${gameNickname}`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">Role / Posisi Dilamar <span className="text-red-400">*</span></label>
                {trial.positions.length > 0 ? (
                  <RoleDropdown positions={trial.positions} value={roleApplied} onChange={setRoleApplied} />
                ) : (
                  <input
                    type="text" required value={roleApplied}
                    onChange={(e) => setRoleApplied(e.target.value)}
                    className={inputCls}
                  />
                )}
              </div>
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">Rank Saat Ini <span className="text-red-400">*</span></label>
                <input name="rank" type="text" required className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">
                  Win Rate Season Ini <span className="text-[#6B6A68]">(%)</span> <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    name="win_rate" type="text" inputMode="decimal" required
                    placeholder="62.5"
                    maxLength={5}
                    className={cn(inputCls, "pr-7")}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                    }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B6A68]">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#9B9A97] mb-1">Sosial Media <span className="text-[#6B6A68]">(Instagram / TikTok)</span> <span className="text-red-400">*</span></label>
                <input name="social_media" type="text" required className={inputCls} placeholder="@username" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#9B9A97] mb-1">
                Hero Pool / Signature Heroes <span className="text-[#6B6A68]">(ketik + Enter / Spasi)</span>
              </label>
              <HeroTagsInput value={heroPool} onChange={setHeroPool} />
            </div>
          </div>
        </div>

        {/* ── Pengalaman ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">Pengalaman & Status</p>
          <div className="space-y-3">
            {/* Free agent toggle */}
            <div className="flex items-center justify-between rounded-lg border border-[#2D2D2D] bg-[#191919] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#E5E2E1]">Status Tim</p>
                <p className="text-xs text-[#9B9A97]">{isFreeAgent ? "Free agent / tidak di tim manapun" : "Masih tergabung di tim lain"}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="sr-only" checked={isFreeAgent} onChange={(e) => setIsFreeAgent(e.target.checked)} />
                <div className={cn("h-5 w-9 rounded-full transition-colors", isFreeAgent ? "bg-green-500" : "bg-[#2D2D2D]")}>
                  <div className={cn("h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform", isFreeAgent ? "translate-x-[18px]" : "translate-x-0.5")} />
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs text-[#9B9A97] mb-1">Pengalaman Kompetitif &amp; Riwayat Tim</label>
              <textarea
                name="competitive_exp"
                rows={3}
                placeholder="Tulis riwayat tim dan turnamen yang pernah kamu ikuti..."
                className="w-full resize-none rounded-md border border-[#2D2D2D] bg-[#191919] px-3 py-2.5 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── Bukti Screenshot ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">Bukti Profil</p>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Screenshot Profil In-Game <span className="text-red-400">*</span>
              <span className="text-[#6B6A68] ml-1">(PNG/JPG/WebP, maks 5 MB)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {!screenshotUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#2D2D2D] bg-[#191919] text-[#6B6A68] hover:border-[#9B9A97] hover:text-[#9B9A97] transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-xs">Mengupload...</span>
                  </>
                ) : (
                  <>
                    <ImageUp className="h-5 w-5" />
                    <span className="text-xs">Klik untuk pilih gambar</span>
                  </>
                )}
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-lg border border-[#2D2D2D]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshotUrl} alt="Screenshot profil" className="w-full max-h-48 object-contain bg-[#141414]" />
                <button
                  type="button"
                  onClick={() => { setScreenshotUrl(null); setScreenshotFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="truncate bg-[#141414] px-3 py-1.5 text-[10px] text-[#6B6A68]">{screenshotFile?.name}</p>
              </div>
            )}
            {uploadErr && (
              <p className="mt-1.5 text-xs text-red-400">{uploadErr}</p>
            )}
          </div>

          {/* CV Upload */}
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              CV / Pengalaman Turnamen
              <span className="text-[#6B6A68] ml-1">(PDF, DOC, atau gambar, maks 10 MB)</span>
            </label>
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx,image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleCvChange}
            />
            {!cvUrl ? (
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                disabled={uploadingCv}
                className="flex h-20 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#2D2D2D] bg-[#191919] text-[#6B6A68] hover:border-[#9B9A97] hover:text-[#9B9A97] transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploadingCv ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-xs">Mengupload...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-5 w-5" />
                    <span className="text-xs">Klik untuk upload CV / dokumen pengalaman</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-[#2D2D2D] bg-[#191919] px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileUp className="h-4 w-4 shrink-0 text-green-400" />
                  <span className="text-xs text-[#D4D4D4] truncate">{cvFile?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setCvUrl(null); setCvFile(null); if (cvInputRef.current) cvInputRef.current.value = ""; }}
                  className="ml-3 shrink-0 text-[#6B6A68] hover:text-red-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {uploadCvErr && (
              <p className="mt-1.5 text-xs text-red-400">{uploadCvErr}</p>
            )}
          </div>
        </div>

        {err && (
          <p className="text-xs text-red-400 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">{err}</p>
        )}

        <button
          type="submit"
          disabled={pending || uploading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#E5E2E1] text-sm font-semibold text-[#191919] hover:bg-white disabled:opacity-50 cursor-pointer"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Daftar Sekarang
        </button>
      </form>
    </div>
  );
};

export { TrialRegistrationForm };
