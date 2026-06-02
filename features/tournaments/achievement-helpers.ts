export function shouldAutoCreateAchievement(
  placement: number | null | undefined
): boolean {
  return placement != null && placement <= 3;
}

export function buildAchievementTitle(
  placement: number,
  tournamentName: string
): string {
  return `Juara ${placement} — ${tournamentName}`;
}
