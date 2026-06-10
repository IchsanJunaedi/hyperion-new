"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded border border-ui-border bg-ui-bg px-3 py-1.5 pr-10 text-sm text-ui-text placeholder-ui-text-muted focus:outline-none focus:border-[#4D4D4D] transition";

const SecuritySection = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      notify.error("Password minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.error("Konfirmasi password tidak cocok.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      notify.error(error.message);
      return;
    }
    notify.success("Password berhasil diubah.");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <p className="text-sm font-medium text-ui-text-dim">Ganti Password</p>
          <p className="mt-0.5 text-xs text-ui-text-2">
            Password baru minimal 8 karakter.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-ui-text-2">Password Baru</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ui-text-muted hover:text-ui-text-2 cursor-pointer"
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-ui-text-2">Konfirmasi Password Baru</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ui-text-muted hover:text-ui-text-2 cursor-pointer"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !newPassword}
          className="flex items-center gap-2 rounded bg-ui-hover px-4 py-2 text-sm text-ui-text-dim transition hover:bg-ui-hover-strong cursor-pointer disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Password
        </button>
      </form>

      <hr className="border-ui-border" />

      <div>
        <p className="text-sm font-medium text-ui-text-dim">Sesi Aktif</p>
        <p className="mt-1 text-xs text-ui-text-2">
          Kamu sedang login di perangkat ini.
        </p>
      </div>
    </div>
  );
};
export { SecuritySection };
