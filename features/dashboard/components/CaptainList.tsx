"use client";

import { Loader2, UserMinus } from "lucide-react";
import { useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { useRouter } from "next/navigation";

import { managerAssignRoleAction } from "../actions";

interface CaptainListProps {
  captains: Array<{
    memberId: string;
    name: string;
    division: string;
  }>;
}

export function CaptainList({ captains }: CaptainListProps) {
  if (captains.length === 0) {
    return (
      <p className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">
        Belum ada Captain. Assign dari "Tambah Member" dengan role Captain.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Nama</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Divisi</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {captains.map((c) => (
            <tr key={c.memberId} className="transition hover:bg-white/[0.02]">
              <td className="px-4 py-3 text-white/80">{c.name}</td>
              <td className="px-4 py-3 text-white/60">{c.division}</td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
                  captain
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
