"use client";

import { useEffect, useState } from "react";

interface TodoBadgeProps {
  orgId?: string;
}

/**
 * Client-side todo badge count. Fetches /api/todos/badge after mount so the
 * smart-todo computation never blocks layout SSR (PRF-02).
 */
const TodoBadge = ({ orgId }: TodoBadgeProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!orgId) return;
    let mounted = true;
    fetch(`/api/todos/badge?orgId=${encodeURIComponent(orgId)}`)
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((json: { count?: number }) => {
        if (!mounted) return;
        setCount(typeof json.count === "number" ? json.count : 0);
      })
      .catch(() => {
        // badge is non-critical — fail silent
      });
    return () => {
      mounted = false;
    };
  }, [orgId]);

  if (count <= 0) return null;

  return (
    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
};
export { TodoBadge };
