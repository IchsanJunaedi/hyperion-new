"use client";

import dynamic from "next/dynamic";

const SkillRadarChart = dynamic(
  () => import("./SkillRadarChart").then((m) => m.SkillRadarChart),
  {
    ssr: false,
    loading: () => <div className="h-[260px] w-full animate-pulse rounded bg-ui-border/30" />,
  }
);

export { SkillRadarChart };
