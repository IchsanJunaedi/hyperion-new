import { MLBB_HEROES } from "./mlbb-heroes";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const NORMALIZED = MLBB_HEROES.map((h) => ({ canonical: h, norm: normalize(h) }));

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev: number[] = [];
  for (let j = 0; j <= n; j++) prev.push(j);
  for (let i = 1; i <= m; i++) {
    const curr: number[] = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = (prev[j] ?? 0) + 1;
      const ins = (curr[j - 1] ?? 0) + 1;
      const sub = (prev[j - 1] ?? 0) + cost;
      curr.push(Math.min(del, ins, sub));
    }
    prev = curr;
  }
  return prev[n] ?? 0;
}

/**
 * Map a raw (possibly OCR-mangled) hero name to the closest canonical MLBB hero.
 * Returns the trimmed raw input if no canonical name is within the edit-distance
 * threshold (so coaches can still see and correct it manually).
 */
export function matchHero(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const target = normalize(trimmed);

  // Exact normalized hit
  const exact = NORMALIZED.find((h) => h.norm === target);
  if (exact) return exact.canonical;

  // Threshold scales with length but caps at 2 to avoid wrong matches on short names
  const threshold = Math.min(2, Math.floor(target.length / 4) + 1);
  let best: { canonical: string; dist: number } | null = null;
  for (const h of NORMALIZED) {
    const dist = levenshtein(target, h.norm);
    if (dist <= threshold && (!best || dist < best.dist)) {
      best = { canonical: h.canonical, dist };
    }
  }
  return best ? best.canonical : trimmed;
}
