import type { ContentStatus } from "@/types/database";

const config: Record<ContentStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-ui-border text-ui-text-2" },
  scheduled: { label: "Menunggu Approve", className: "bg-yellow-500/10 text-yellow-400" },
  approved: { label: "Disetujui", className: "bg-green-500/10 text-green-400" },
  published: { label: "Published", className: "bg-blue-500/10 text-blue-400" },
};

const ContentStatusBadge = ({ status }: { status: ContentStatus }) => {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};
export { ContentStatusBadge };
