"use client";

import { useActionState } from "react";
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

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#9B9A97]">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full border border-[#2D2D2D] bg-[#191919] px-3 py-2.5 text-sm text-[#E5E2E1] outline-none transition focus:border-[#F5C400]/50 placeholder:text-[#6B6A68]"
          placeholder="admin@example.com"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#9B9A97]">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full border border-[#2D2D2D] bg-[#191919] px-3 py-2.5 text-sm text-[#E5E2E1] outline-none transition focus:border-[#F5C400]/50"
        />
      </div>
      {state?.error && (
        <p className="text-xs text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer border border-[#F5C400] bg-transparent py-2.5 text-xs font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50"
      >
        {pending ? "Masuk..." : "Masuk"}
      </button>
    </form>
  );
};
export { AdminLoginForm };
