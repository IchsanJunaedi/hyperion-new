import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TournamentJourney } from "../components/TournamentJourney";

describe("TournamentJourney", () => {
  it("renders empty stages gracefully", () => {
    const { container } = render(
      <TournamentJourney stages={[]} tournamentName="Test Tournament" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders and sorts stages chronologically", () => {
    const mockStages = [
      {
        id: "stage-2",
        tournament_id: "t-1",
        stage_name: "Babak 32",
        scheduled_at: "2026-07-03T01:00:00.000Z",
        is_completed: true,
        notes: null,
        created_at: "2026-06-01T00:00:00.000Z",
        matches: [
          {
            id: "m-2",
            stage_id: "stage-2",
            round_label: "Match 2",
            opponent_name: null,
            our_score: 3,
            opponent_score: 1,
            is_win: true,
            created_at: "2026-06-01T00:00:00.000Z",
            notes: null,
            played_at: null,
            match_format: null,
            scheduled_at: null,
            opponent_id: null,
            game_results: [],
          },
        ],
      },
      {
        id: "stage-1",
        tournament_id: "t-1",
        stage_name: "Babak 64",
        scheduled_at: "2026-07-01T01:00:00.000Z",
        is_completed: true,
        notes: null,
        created_at: "2026-06-01T00:00:00.000Z",
        matches: [
          {
            id: "m-1",
            stage_id: "stage-1",
            round_label: "Match 1",
            opponent_name: null,
            our_score: 2,
            opponent_score: 0,
            is_win: true,
            created_at: "2026-06-01T00:00:00.000Z",
            notes: null,
            played_at: null,
            match_format: null,
            scheduled_at: null,
            opponent_id: null,
            game_results: [],
          },
        ],
      },
    ];

    render(
      <TournamentJourney stages={mockStages} tournamentName="Test Tournament" />
    );

    expect(screen.getByText("Babak 64")).toBeInTheDocument();
    expect(screen.getByText("Babak 32")).toBeInTheDocument();
  });
});
