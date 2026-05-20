// features/analytics/computations.ts

export interface RawScrimResult {
  scrim_id: string;
  format: string;
  is_win: boolean | null;
}

export interface RawAttendance {
  user_id: string;
  scrim_id: string;
  status: "confirmed" | "declined" | "tentative" | "pending";
}

export interface PlayerInfo {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  jersey_number: number | null;
  position: string | null;
}

export interface OverviewStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export interface FormatStat {
  format: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface PlayerStat extends PlayerInfo {
  attendanceRate: number;
  totalPresent: number;
  totalScrims: number;
  winRateWhenPresent: number;
  winsWhenPresent: number;
  scrimsWhenPresent: number;
  streak: number; // positive = hadir beruntun, negative = absen beruntun
}

export function computeOverviewStats(results: RawScrimResult[]): OverviewStats {
  const wins = results.filter((r) => r.is_win === true).length;
  const losses = results.filter((r) => r.is_win === false).length;
  const draws = results.filter((r) => r.is_win === null).length;
  const total = results.length;
  const winRate = total === 0 ? 0 : Math.round((wins / total) * 100);
  return { total, wins, losses, draws, winRate };
}

export function computeFormatBreakdown(results: RawScrimResult[]): FormatStat[] {
  const map = new Map<string, { wins: number; losses: number; total: number }>();
  for (const r of results) {
    const key = r.format.toLowerCase();
    const entry = map.get(key) ?? { wins: 0, losses: 0, total: 0 };
    entry.total++;
    if (r.is_win === true) entry.wins++;
    else if (r.is_win === false) entry.losses++;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([format, { wins, losses, total }]) => ({
      format,
      total,
      wins,
      losses,
      winRate: total === 0 ? 0 : Math.round((wins / total) * 100),
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * results harus diurutkan terbaru dulu (descending scheduled_at)
 * untuk kalkulasi streak yang benar.
 */
export function computePlayerStats(
  players: PlayerInfo[],
  attendances: RawAttendance[],
  results: RawScrimResult[],
): PlayerStat[] {
  const totalScrims = results.length;
  const resultByScrimId = new Map(results.map((r) => [r.scrim_id, r]));

  const attendancesByPlayer = new Map<string, RawAttendance[]>();
  for (const a of attendances) {
    const arr = attendancesByPlayer.get(a.user_id) ?? [];
    arr.push(a);
    attendancesByPlayer.set(a.user_id, arr);
  }

  const stats: PlayerStat[] = players.map((player) => {
    const playerAttendances = attendancesByPlayer.get(player.user_id) ?? [];
    const confirmed = playerAttendances.filter((a) => a.status === "confirmed");
    const totalPresent = confirmed.length;
    const attendanceRate =
      totalScrims === 0 ? 0 : Math.round((totalPresent / totalScrims) * 100);

    const scrimsWhenPresent = confirmed.length;
    const confirmedScrimIds = new Set(confirmed.map((a) => a.scrim_id));
    const winsWhenPresent = confirmed.filter((a) => {
      const result = resultByScrimId.get(a.scrim_id);
      return result?.is_win === true;
    }).length;
    const winRateWhenPresent =
      scrimsWhenPresent === 0
        ? 0
        : Math.round((winsWhenPresent / scrimsWhenPresent) * 100);

    // Streak: iterasi dari scrim terbaru ke lama
    let streak = 0;
    for (const r of results) {
      const isPresent = confirmedScrimIds.has(r.scrim_id);
      if (streak === 0) {
        streak = isPresent ? 1 : -1;
      } else if (streak > 0 && isPresent) {
        streak++;
      } else if (streak < 0 && !isPresent) {
        streak--;
      } else {
        break;
      }
    }

    return {
      ...player,
      attendanceRate,
      totalPresent,
      totalScrims,
      winRateWhenPresent,
      winsWhenPresent,
      scrimsWhenPresent,
      streak,
    };
  });

  return stats.sort((a, b) => b.attendanceRate - a.attendanceRate);
}
