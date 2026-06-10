"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { changeRoleAction } from "../actions";
import { useNotify } from "./NotifyModal";
import type { MemberRole } from "@/types/database";

const ROLES: { value: MemberRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "coach", label: "Coach" },
  { value: "captain", label: "Captain" },
  { value: "member", label: "Member" },
];

interface EditRoleButtonProps {
  memberId: string;
  currentRole: string;
  name: string;
}

const EditRoleButton = ({ memberId, currentRole, name }: EditRoleButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { success, error: notifyError } = useNotify();
  const ref = useRef<HTMLDivElement>(null);

  function handleSelect(role: MemberRole) {
    if (role === currentRole) { setOpen(false); return; }
    startTransition(async () => {
      const res = await changeRoleAction(memberId, role);
      if (res.ok) {
        success(`Role ${name} diubah ke ${role}`);
        setOpen(false);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-ui-text-muted hover:bg-ui-hover hover:text-blue-400 disabled:opacity-40"
        title="Ganti role"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul className="absolute right-0 top-full z-50 mt-1 min-w-[110px] rounded border border-ui-border bg-ui-surface py-1 shadow-xl text-sm">
            {ROLES.map((r) => (
              <li key={r.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(r.value)}
                  className={`w-full px-3 py-1.5 text-left transition hover:bg-ui-hover ${
                    r.value === currentRole
                      ? "text-ui-text-dim font-medium"
                      : "text-ui-text-2"
                  }`}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
export { EditRoleButton };
