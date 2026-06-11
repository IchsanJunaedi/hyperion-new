import { HERO_CLASSES, ROLES, type RoleName } from "./mlbb-heroes";

export const ROLE_WEIGHTS: Record<string, Record<RoleName, number>> = {
  Marksman: { gold_lane: 10, mid_lane: 1, jungler: 1, exp_lane: 1, roamer: 1 },
  Mage:     { mid_lane: 8, gold_lane: 3, roamer: 1, exp_lane: 3, jungler: 1 },
  Tank:     { roamer: 8, exp_lane: 3, jungler: 1, mid_lane: 1, gold_lane: 1 },
  Support:  { roamer: 8, mid_lane: 3, gold_lane: 1, exp_lane: 1, jungler: 1 },
  Assassin: { jungler: 8, roamer: 1, mid_lane: 4, exp_lane: 1, gold_lane: 1 },
  Fighter:  { exp_lane: 6, jungler: 6, roamer: 1, gold_lane: 1, mid_lane: 1 },
};

export function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length === 0) return [[]];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const copy = [...arr];
    const elem = copy.splice(i, 1)[0];
    if (elem === undefined) continue;
    const sub = getPermutations(copy);
    for (const s of sub) {
      result.push([elem, ...s]);
    }
  }
  return result;
}

export function assignRoles(heroes: string[]): RoleName[] {
  const perms = getPermutations([...ROLES]);
  let bestPerm: RoleName[] = [...ROLES];
  let maxScore = -1;

  for (const perm of perms) {
    let score = 0;
    for (let i = 0; i < heroes.length; i++) {
      const hero = heroes[i];
      const role = perm[i];
      if (hero && role) {
        const cls = HERO_CLASSES[hero] ?? "";
        const weights = ROLE_WEIGHTS[cls] ?? { exp_lane: 1, jungler: 1, mid_lane: 1, gold_lane: 1, roamer: 1 };
        score += weights[role] ?? 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestPerm = perm;
    }
  }
  return bestPerm;
}
