import { Inbox, Send } from "lucide-react";

import { listIncomingRequests, listOutgoingRequests } from "@/features/matchmaking/queries";
import { ScrimRequestList } from "./ScrimRequestList";

interface MatchmakingSectionProps {
  orgId: string;
  orgSlug: string;
}

export async function MatchmakingSection({ orgId, orgSlug }: MatchmakingSectionProps) {
  const [incoming, outgoing] = await Promise.all([
    listIncomingRequests(orgId),
    listOutgoingRequests(orgId),
  ]);

  const pendingIncoming = incoming.filter((r) => r.status === "pending");

  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-ui-text">Matchmaking</h2>

      {pendingIncoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Inbox className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-medium text-ui-text-2">
              Request Masuk ({pendingIncoming.length})
            </span>
          </div>
          <ScrimRequestList requests={pendingIncoming} type="incoming" orgSlug={orgSlug} />
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-ui-text-2">
              Request Keluar ({outgoing.length})
            </span>
          </div>
          <ScrimRequestList requests={outgoing} type="outgoing" orgSlug={orgSlug} />
        </div>
      )}
    </section>
  );
}
