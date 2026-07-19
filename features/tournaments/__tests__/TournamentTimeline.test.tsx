import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TournamentTimeline } from "../components/TournamentTimeline";

vi.mock("@/features/dashboard/components/NotifyModal", () => ({
  useNotify: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("TournamentTimeline", () => {
  it("renders empty stages placeholder", () => {
    render(
      <TournamentTimeline
        stages={[]}
        tournamentId="t-1"
        orgSlug="team-1"
        canManage={false}
        attendingPlayers={[]}
      />
    );
    expect(screen.getByText(/Belum ada tahapan/i)).toBeInTheDocument();
  });

  it("renders stages in sorted order", () => {
    const mockStages = [
      {
        id: "stage-2",
        tournament_id: "t-1",
        stage_name: "Babak 32",
        scheduled_at: "2026-07-03T01:00:00.000Z",
        is_completed: false,
        notes: null,
        created_at: "2026-06-01T00:00:00.000Z",
        matches: [],
      },
      {
        id: "stage-1",
        tournament_id: "t-1",
        stage_name: "Babak 64",
        scheduled_at: "2026-07-01T01:00:00.000Z",
        is_completed: false,
        notes: null,
        created_at: "2026-06-01T00:00:00.000Z",
        matches: [],
      },
    ];

    render(
      <TournamentTimeline
        stages={mockStages}
        tournamentId="t-1"
        orgSlug="team-1"
        canManage={false}
        attendingPlayers={[]}
      />
    );

    expect(screen.getByText("Babak 64")).toBeInTheDocument();
    expect(screen.getByText("Babak 32")).toBeInTheDocument();
  });
});
