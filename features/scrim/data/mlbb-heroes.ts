// Static MLBB hero list — sorted alphabetically
export const MLBB_HEROES: string[] = [
  "Aamon", "Akai", "Aldous", "Alpha", "Alucard", "Angela", "Atlas", "Aulus",
  "Aurora", "Badang", "Balmond", "Barats", "Baxia", "Beatrix", "Belerick",
  "Benedetta", "Brody", "Bruno", "Carmilla", "Cecilion", "Chang'e", "Chip",
  "Chou", "Cici", "Claude", "Clint", "Cyclops", "Diggie", "Dyrroth",
  "Esmeralda", "Estes", "Eudora", "Fanny", "Faramis", "Floryn", "Franco",
  "Freya", "Gatotkaca", "Gord", "Granger", "Grock", "Guinevere", "Gusion",
  "Hanabi", "Hanzo", "Harith", "Harley", "Hayabusa", "Helcurt", "Hilda",
  "Hylos", "Irithel", "Ixia", "Jawhead", "Johnson", "Joy", "Julian",
  "Kagura", "Karrie", "Khaleed", "Khufra", "Kimmy", "Lancelot", "Lapu-Lapu",
  "Layla", "Leomord", "Lesley", "Ling", "Lolita", "Lukas", "Lunox", "Lylia",
  "Mathilda", "Melissa", "Minsitthar", "Minotaur", "Miya", "Moskov",
  "Nana", "Natalia", "Natan", "Nolan", "Novaria", "Odette", "Paquito",
  "Pharsa", "Phoveus", "Popol and Kupa", "Rafaela", "Roger", "Ruby",
  "Saber", "Silvanna", "Sun", "Suyou", "Talon", "Terizla", "Thamuz",
  "Tigreal", "Uranus", "Vale", "Valentina", "Valir", "Vexana", "Wanwan",
  "X.Borg", "Xavier", "Yi Sun-shin", "Yin", "Yu Zhong", "Yve", "Zhask",
  "Zhuxin", "Zilong",
].sort((a, b) => a.localeCompare(b));

/** Convert hero name to the slug used for /public/heroes/<slug>.webp */
export function heroToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Returns the path to the hero's WebP avatar image stored in /public/heroes/. */
export function getHeroImageUrl(name: string): string {
  return `/heroes/${heroToSlug(name)}.webp`;
}

export const ROLE_LABELS: Record<string, string> = {
  exp_lane: "EXP Lane",
  jungler: "Jungler",
  mid_lane: "Mid Lane",
  gold_lane: "Gold Lane",
  roamer: "Roamer",
};

export const ROLES = ["exp_lane", "jungler", "mid_lane", "gold_lane", "roamer"] as const;
export type RoleName = (typeof ROLES)[number];
