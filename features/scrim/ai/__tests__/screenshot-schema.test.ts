import { describe, it, expect } from "vitest";
import {
  normalizeDraftResult,
  normalizeScoreboardResult,
  validateScrimStoragePath,
} from "../screenshot-schema";

describe("validateScrimStoragePath", () => {
  const orgId = "11111111-1111-1111-1111-111111111111";
  const scrimId = "22222222-2222-2222-2222-222222222222";

  it("accepts a path under the org+scrim folder", () => {
    const path = `${orgId}/scrim-results/${scrimId}/game-1-123.png`;
    expect(validateScrimStoragePath(path, orgId, scrimId)).toBe(true);
  });

  it("rejects traversal / wrong org / wrong scrim", () => {
    expect(validateScrimStoragePath(`${orgId}/scrim-results/${scrimId}/../x.png`, orgId, scrimId)).toBe(false);
    expect(validateScrimStoragePath(`other/scrim-results/${scrimId}/g.png`, orgId, scrimId)).toBe(false);
    expect(validateScrimStoragePath(`${orgId}/scrim-results/zzzz/g.png`, orgId, scrimId)).toBe(false);
    expect(validateScrimStoragePath("", orgId, scrimId)).toBe(false);
  });
});

describe("normalizeDraftResult", () => {
  it("fuzzy-corrects hero names and pads bans to 5", () => {
    const out = normalizeDraftResult({
      bans: { our: ["Lanclot"], enemy: [] },
      picks: {
        our: { exp_lane: "Yu zhong", jungler: "", mid_lane: "", gold_lane: "", roamer: "" },
        enemy: { exp_lane: "", jungler: "", mid_lane: "", gold_lane: "", roamer: "" },
      },
    });
    expect(out.bans.our).toHaveLength(5);
    expect(out.bans.our[0]).toBe("Lancelot");
    expect(out.picks.our.exp_lane).toBe("Yu Zhong");
  });

  it("tolerates missing fields without throwing", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = normalizeDraftResult({} as any);
    expect(out.bans.enemy).toHaveLength(5);
    expect(out.picks.enemy.roamer).toBe("");
  });
});

describe("normalizeScoreboardResult", () => {
  it("clamps and coerces numeric fields, roles, and enemyPlayers", () => {
    const out = normalizeScoreboardResult({
      isWin: true,
      ourScore: 2,
      opponentScore: 1,
      durationSeconds: 900,
      players: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { displayName: "A", heroName: "Guslon", role: "jungler", kills: 5, deaths: 2, assists: 7, gold: 12000 } as any
      ],
      enemyPlayers: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { displayName: "B", heroName: "Martis", role: "exp_lane", kills: 1, deaths: 5, assists: 2, gold: 8000 } as any
      ],
    });
    const p0 = out.players[0]!;
    const ep0 = out.enemyPlayers[0]!;
    
    expect(out.isWin).toBe(true);
    expect(p0.heroName).toBe("Gusion");
    expect(p0.role).toBe("jungler");
    expect(p0.kills).toBe(5);
    
    expect(ep0.heroName).toBe("Martis");
    expect(ep0.role).toBe("exp_lane");
    expect(ep0.kills).toBe(1);
  });

  it("defaults malformed players and enemyPlayers arrays to empty", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = normalizeScoreboardResult({ isWin: false } as any);
    expect(out.players).toEqual([]);
    expect(out.enemyPlayers).toEqual([]);
    expect(out.ourScore).toBe(0);
  });
});
