import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Poll = Database["public"]["Tables"]["polls"]["Row"];
export type PollVote = Database["public"]["Tables"]["poll_votes"]["Row"];

export interface PollWithVotes extends Poll {
  votes: PollVote[];
  my_vote: number | null;
  total_votes: number;
}

/**
 * List polls for an org with vote counts.
 */
export async function listPolls(orgId: string): Promise<PollWithVotes[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: polls } = await supabase
    .from("polls")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!polls || polls.length === 0) return [];

  const pollIds = polls.map((p) => p.id);
  const { data: votes } = await supabase
    .from("poll_votes")
    .select("*")
    .in("poll_id", pollIds);

  const allVotes = votes ?? [];

  return polls.map((poll) => {
    const pollVotes = allVotes.filter((v) => v.poll_id === poll.id);
    const myVote = user
      ? pollVotes.find((v) => v.user_id === user.id)?.option_index ?? null
      : null;
    return {
      ...poll,
      votes: pollVotes,
      my_vote: myVote,
      total_votes: pollVotes.length,
    };
  });
}
