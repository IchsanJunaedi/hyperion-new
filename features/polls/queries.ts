import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Poll = Database["public"]["Tables"]["polls"]["Row"];
export type PollVote = Database["public"]["Tables"]["poll_votes"]["Row"];
export type AvailabilityVote = Database["public"]["Tables"]["poll_availability_votes"]["Row"];

export interface PollWithVotes extends Poll {
  votes: PollVote[];
  my_vote: number | null;
  total_votes: number;
  availability_votes: AvailabilityVote[];
  my_slot_indices: number[];
}

export async function listPolls(orgId: string): Promise<PollWithVotes[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: polls } = await supabase
    .from("polls")
    .select(
      "id, organization_id, question, type, options, availability_slots, is_closed, expires_at, created_by, created_at",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!polls || polls.length === 0) return [];

  const pollIds = polls.map((p) => p.id);

  const [votesRes, availVotesRes] = await Promise.all([
    supabase
      .from("poll_votes")
      .select("id, poll_id, user_id, option_index, created_at")
      .in("poll_id", pollIds)
      .limit(2000),
    supabase
      .from("poll_availability_votes")
      .select("id, poll_id, user_id, slot_index, created_at")
      .in("poll_id", pollIds)
      .limit(5000),
  ]);

  const allVotes = votesRes.data ?? [];
  const allAvailVotes = availVotesRes.data ?? [];

  return polls.map((poll) => {
    const pollVotes = allVotes.filter((v) => v.poll_id === poll.id);
    const pollAvailVotes = allAvailVotes.filter((v) => v.poll_id === poll.id);
    const myVote = user
      ? pollVotes.find((v) => v.user_id === user.id)?.option_index ?? null
      : null;
    const mySlotIndices = user
      ? pollAvailVotes.filter((v) => v.user_id === user.id).map((v) => v.slot_index)
      : [];
    return {
      ...poll,
      votes: pollVotes,
      my_vote: myVote,
      total_votes: pollVotes.length,
      availability_votes: pollAvailVotes,
      my_slot_indices: mySlotIndices,
    };
  });
}
