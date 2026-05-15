"use client";

import Link from "next/link";
import { useState } from "react";

import { UserDetailModal, type UserDetail } from "./UserDetailModal";

interface HomeSectionProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  rows: Array<{
    id: string;
    cols: string[];
    roleCol?: number;
    userDetail?: UserDetail;
  }>;
  emptyText?: string;
}

const roleColors: Record<string, string> = {
  owner: "text-yellow-400",
  manager: "text-green-400",
  coach: "text-blue-400",
  captain: "text-purple-400",
  member: "text-[#9B9A97]",
  none: "text-[#6B6A68]",
};

export function HomeSection({ title, icon, href, rows, emptyText = "Belum ada data" }: HomeSectionProps) {
  const [selected, setSelected] = useState<UserDetail | null>(null);

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#E5E2E1] flex items-center gap-2">
            {icon} {title}
          </h2>
          <Link href={href} className="text-xs text-[#9B9A97] hover:text-[#D4D4D4] transition-colors">
            Detail →
          </Link>
        </div>
        <div className="flex flex-col">
          {rows.length === 0 ? (
            <p className="py-3 px-3 text-sm text-[#6B6A68]">{emptyText}</p>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                onClick={() => row.userDetail && setSelected(row.userDetail)}
                className={`grid grid-cols-[200px_1fr_100px] items-center py-2 px-3 -mx-3 hover:bg-[#2C2C2C] rounded transition-colors gap-4 ${row.userDetail ? "cursor-pointer" : ""}`}
              >
                {row.cols.map((col, i) => (
                  <span
                    key={i}
                    className={`text-sm truncate ${
                      i === 0 ? "text-[#D4D4D4]" :
                      i === row.roleCol ? `font-medium ${roleColors[col] ?? "text-[#9B9A97]"}` :
                      "text-[#9B9A97]"
                    }`}
                  >
                    {col}
                  </span>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
      <UserDetailModal user={selected} onClose={() => setSelected(null)} />
    </>
  );
}
