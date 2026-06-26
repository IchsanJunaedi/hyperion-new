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
  "Saber", "Silvanna", "Sun", "Suyou", "Terizla", "Thamuz",
  "Tigreal", "Uranus", "Vale", "Valentina", "Valir", "Vexana", "Wanwan",
  "X.Borg", "Xavier", "Yi Sun-shin", "Yin", "Yu Zhong", "Yve", "Zhask",
  "Zhuxin", "Zilong",
  // New added heroes
  "Alice", "Bane", "Karina", "Argus", "Martis", "Kaja", "Selena", "Kadita",
  "Masha", "Luo Yi", "Edith", "Fredrinn", "Arlott", "Sora", "Marcel",
  "Gloo", "Kalea", "Zetian", "Obsidia", "Hirara"
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

export const HERO_CLASSES: Record<string, string> = {
  "Aamon": "Assassin", "Akai": "Tank", "Aldous": "Fighter", "Alice": "Mage",
  "Alpha": "Fighter", "Alucard": "Fighter", "Angela": "Support", "Argus": "Fighter",
  "Arlott": "Fighter", "Atlas": "Tank", "Aulus": "Fighter", "Aurora": "Mage",
  "Badang": "Fighter", "Balmond": "Fighter", "Bane": "Fighter", "Barats": "Tank",
  "Baxia": "Tank", "Beatrix": "Marksman", "Belerick": "Tank", "Benedetta": "Assassin",
  "Brody": "Marksman", "Bruno": "Marksman", "Carmilla": "Support", "Cecilion": "Mage",
  "Chang'e": "Mage", "Chip": "Tank", "Chou": "Fighter", "Cici": "Fighter",
  "Claude": "Marksman", "Clint": "Marksman", "Cyclops": "Mage", "Diggie": "Support",
  "Dyrroth": "Fighter", "Edith": "Tank", "Esmeralda": "Tank", "Estes": "Support",
  "Eudora": "Mage", "Fanny": "Assassin", "Faramis": "Support", "Floryn": "Support",
  "Franco": "Tank", "Fredrinn": "Fighter", "Freya": "Fighter", "Gatotkaca": "Tank",
  "Gloo": "Tank", "Gord": "Mage", "Granger": "Marksman", "Grock": "Tank",
  "Guinevere": "Fighter", "Gusion": "Assassin", "Hanabi": "Marksman", "Hanzo": "Assassin",
  "Harith": "Mage", "Harley": "Mage", "Hayabusa": "Assassin", "Helcurt": "Assassin",
  "Hilda": "Fighter", "Hylos": "Tank", "Irithel": "Marksman", "Ixia": "Marksman",
  "Jawhead": "Fighter", "Johnson": "Tank", "Joy": "Assassin", "Julian": "Fighter",
  "Kadita": "Mage", "Kagura": "Mage", "Kaja": "Support", "Kalea": "Support",
  "Karrie": "Marksman", "Karina": "Assassin", "Khaleed": "Fighter", "Khufra": "Tank",
  "Kimmy": "Marksman", "Lancelot": "Assassin", "Lapu-Lapu": "Fighter", "Layla": "Marksman",
  "Leomord": "Fighter", "Lesley": "Marksman", "Ling": "Assassin", "Lolita": "Tank",
  "Luo Yi": "Mage", "Lukas": "Fighter", "Lunox": "Mage", "Lylia": "Mage",
  "Marcel": "Support", "Martis": "Fighter", "Masha": "Fighter", "Mathilda": "Support",
  "Melissa": "Marksman", "Minsitthar": "Fighter", "Minotaur": "Tank", "Miya": "Marksman",
  "Moskov": "Marksman", "Nana": "Mage", "Natalia": "Assassin", "Natan": "Marksman",
  "Nolan": "Assassin", "Novaria": "Mage", "Obsidia": "Marksman", "Odette": "Mage",
  "Paquito": "Fighter", "Pharsa": "Mage", "Phoveus": "Fighter", "Popol and Kupa": "Marksman",
  "Rafaela": "Support", "Roger": "Fighter", "Ruby": "Fighter", "Saber": "Assassin",
  "Selena": "Assassin", "Silvanna": "Fighter", "Sora": "Fighter", "Sun": "Fighter",
  "Suyou": "Assassin", "Terizla": "Fighter", "Thamuz": "Fighter", "Tigreal": "Tank",
  "Uranus": "Tank", "Vale": "Mage", "Valentina": "Mage", "Valir": "Mage",
  "Vexana": "Mage", "Wanwan": "Marksman", "X.Borg": "Fighter", "Xavier": "Mage",
  "Yi Sun-shin": "Assassin", "Yin": "Fighter", "Yu Zhong": "Fighter", "Yve": "Mage",
  "Zetian": "Mage", "Zhask": "Mage", "Zhuxin": "Mage", "Zilong": "Fighter",
  "Hirara": "Assassin",
};

export const ROLE_LABELS: Record<string, string> = {
  exp_lane: "EXP Lane",
  jungler: "Jungler",
  mid_lane: "Mid Lane",
  gold_lane: "Gold Lane",
  roamer: "Roamer",
};

export const ROLES = ["exp_lane", "jungler", "mid_lane", "gold_lane", "roamer"] as const;
export type RoleName = (typeof ROLES)[number];
