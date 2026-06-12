"use client";

import dynamic from "next/dynamic";

const Sparkline = dynamic(() => import("./Sparkline").then((m) => m.Sparkline), {
  ssr: false,
  loading: () => <div className="h-7 w-full" />,
});

export { Sparkline };
