"use client";

import { useState } from "react";

import { UserDetailModal, type UserDetail } from "./UserDetailModal";

interface UserActiveTableProps {
  users: UserDetail[];
}

export function UserActiveTable({ users }: UserActiveTableProps) {
  const [selected, setSelected] = useState<UserDetail | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Username</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Divisi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">WA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr
                key={u.id}
                onClick={() => setSelected(u)}
                className="cursor-pointer transition hover:bg-white/[0.04]"
              >
                <td className="px-4 py-3 text-white/80">{u.fullName ?? "—"}</td>
                <td className="px-4 py-3 text-white/60">{u.username ?? "—"}</td>
                <td className="px-4 py-3 text-white/60">{u.email ?? "—"}</td>
                <td className="px-4 py-3">
                  {u.role ? (
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "owner" ? "bg-yellow-500/10 text-yellow-400" :
                      u.role === "manager" ? "bg-green-500/10 text-green-400" :
                      u.role === "coach" ? "bg-blue-500/10 text-blue-400" :
                      u.role === "captain" ? "bg-purple-500/10 text-purple-400" :
                      "bg-white/5 text-white/60"
                    }`}>{u.role}</span>
                  ) : (
                    <span className="text-xs text-white/30">none</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/60">{u.division ?? "—"}</td>
                <td className="px-4 py-3 text-white/60">{u.phoneWa ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <UserDetailModal user={selected} onClose={() => setSelected(null)} />
    </>
  );
}
