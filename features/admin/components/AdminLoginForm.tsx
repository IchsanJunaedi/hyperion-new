"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useActionState } from "react";
import type { AdminSignInResult } from "@/app/admin/login/actions";

interface Props {
  action: (formData: FormData) => Promise<AdminSignInResult>;
}

const AdminLoginForm = ({ action }: Props) => {
  const wrappedAction = (_prev: AdminSignInResult, formData: FormData) =>
    action(formData);

  const [state, formAction, pending] = useActionState<AdminSignInResult, FormData>(
    wrappedAction,
    {}
  );

  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/60 p-6"
    >
      <div className="space-y-1">
        <label htmlFor="email" className="text-xs font-medium text-white/70">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-xs font-medium text-white/70">
          Password
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 pr-10 text-sm text-white focus:border-yellow-400 focus:outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
          />
          {passwordValue && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer opacity-70 hover:opacity-100"
            >
              {showPassword ? <EyeOff size={16} color="white" /> : <Eye size={16} color="white" />}
            </button>
          )}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-yellow-400 px-5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Masuk
      </button>
    </form>
  );
};
export { AdminLoginForm };
