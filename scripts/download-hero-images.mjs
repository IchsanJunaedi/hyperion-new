/**
 * MLBB Hero Image Downloader v3
 *
 * Uses the Fandom Wiki API (imageinfo) to resolve canonical CDN URLs for each
 * hero's circle portrait icon (Hero{ID}1-icon.png), then downloads and
 * converts to 128×128 WebP.
 *
 * Usage: node scripts/download-hero-images.mjs
 */

import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "heroes");
const SIZE = 128;
const DELAY_MS = 500;

// ── Official hero ID → name mapping (from Fandom wiki) ───────────────────────
const HERO_IDS = {
  "Miya": 1, "Balmond": 2, "Saber": 3, "Alice": 4, "Nana": 5, "Tigreal": 6,
  "Alucard": 7, "Karina": 8, "Akai": 9, "Franco": 10, "Bane": 11, "Bruno": 12,
  "Clint": 13, "Rafaela": 14, "Eudora": 15, "Zilong": 16, "Fanny": 17,
  "Layla": 18, "Minotaur": 19, "Lolita": 20, "Hayabusa": 21, "Freya": 22,
  "Gord": 23, "Natalia": 24, "Kagura": 25, "Chou": 26, "Sun": 27, "Alpha": 28,
  "Ruby": 29, "Yi Sun-shin": 30, "Moskov": 31, "Johnson": 32, "Cyclops": 33,
  "Estes": 34, "Hilda": 35, "Aurora": 36, "Lapu-Lapu": 37, "Vexana": 38,
  "Roger": 39, "Karrie": 40, "Gatotkaca": 41, "Harley": 42, "Irithel": 43,
  "Grock": 44, "Argus": 45, "Odette": 46, "Lancelot": 47, "Diggie": 48,
  "Hylos": 49, "Zhask": 50, "Helcurt": 51, "Pharsa": 52, "Lesley": 53,
  "Jawhead": 54, "Angela": 55, "Gusion": 56, "Valir": 57, "Martis": 58,
  "Uranus": 59, "Hanabi": 60, "Chang'e": 61, "Kaja": 62, "Selena": 63,
  "Aldous": 64, "Claude": 65, "Vale": 66, "Leomord": 67, "Lunox": 68,
  "Hanzo": 69, "Belerick": 70, "Kimmy": 71, "Thamuz": 72, "Harith": 73,
  "Minsitthar": 74, "Kadita": 75, "Faramis": 76, "Badang": 77, "Khufra": 78,
  "Granger": 79, "Guinevere": 80, "Esmeralda": 81, "Terizla": 82, "X.Borg": 83,
  "Ling": 84, "Dyrroth": 85, "Lylia": 86, "Baxia": 87, "Masha": 88,
  "Wanwan": 89, "Silvanna": 90, "Cecilion": 91, "Carmilla": 92, "Atlas": 93,
  "Popol and Kupa": 94, "Yu Zhong": 95, "Luo Yi": 96, "Khaleed": 97,
  "Barats": 98, "Brody": 99, "Yve": 100, "Mathilda": 101, "Paquito": 102,
  "Beatrix": 103, "Phoveus": 104, "Aulus": 105, "Natan": 106, "Floryn": 107,
  "Edith": 108, "Aamon": 109, "Valentina": 110, "Yin": 111, "Xavier": 112,
  "Julian": 113, "Melissa": 114, "Fredrinn": 115, "Joy": 116, "Novaria": 117,
  "Arlott": 118, "Ixia": 119, "Nolan": 120, "Cici": 121, "Chip": 122,
  "Zhuxin": 123, "Suyou": 124, "Lukas": 127, "Gloo": 126, "Sora": 131, "Marcel": 132,
  // Heroes that may have different IDs — fallback to name search
  "Benedetta": 118, "Kalea": 133, "Zetian": 129, "Obsidia": 130, "Hirara": 133,
};

const HEROES = [
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
];

function heroToSlug(name) {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ── Fetch with redirect following ─────────────────────────────────────────────
function fetchBuffer(url, redirectCount = 0) {
  if (redirectCount > 8) return Promise.reject(new Error("Too many redirects"));
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/webp,image/png,image/*,*/*",
        "Referer": "https://mobile-legends.fandom.com/",
      },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const location = res.headers.location;
        res.resume();
        return fetchBuffer(location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    fetchBuffer(url).then((buf) => {
      try { resolve(JSON.parse(buf.toString("utf8"))); }
      catch { reject(new Error("JSON parse error")); }
    }).catch(reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Get icon URL via wiki imageinfo API ───────────────────────────────────────
// This hits api.php directly (not Special:FilePath) to avoid 403 blocks
async function getIconUrl(heroId) {
  const paddedId = String(heroId).padStart(2, "0");
  const filename = `Hero${paddedId}1-icon.png`;
  const apiUrl = `https://mobile-legends.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
  try {
    const data = await fetchJson(apiUrl);
    const pages = data?.query?.pages ?? {};
    for (const page of Object.values(pages)) {
      const url = page?.imageinfo?.[0]?.url;
      if (url) return url;
    }
  } catch { /* fall through */ }
  return null;
}

// ── Direct CDN fetch (static.wikia.nocookie.net) ──────────────────────────────
// The browser agent confirmed Aamon's URL. We build a mapping of known hashes
// for heroes where the API approach works. For unknowns, we search.
async function searchIconByName(heroName) {
  // Use allimages API to find Hero*1-icon.png files matching the hero's ID
  // This is a broader search that can work even if we don't know the exact filename
  const apiUrl = `https://mobile-legends.fandom.com/api.php?action=query&list=allimages&aiprefix=Hero&format=json&ailimit=100&aisort=name`;
  try {
    // This is too broad — instead search the hero's wiki page for linked icon
    const pageUrl = `https://mobile-legends.fandom.com/api.php?action=parse&page=${encodeURIComponent(heroName)}&prop=images&format=json`;
    const data = await fetchJson(pageUrl);
    const images = data?.parse?.images ?? [];
    const iconFile = images.find((img) => img.match(/^Hero\d+1-icon/i));
    if (iconFile) {
      const iconApiUrl = `https://mobile-legends.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(iconFile)}&prop=imageinfo&iiprop=url&format=json`;
      const iconData = await fetchJson(iconApiUrl);
      const pages = iconData?.query?.pages ?? {};
      for (const page of Object.values(pages)) {
        const url = page?.imageinfo?.[0]?.url;
        if (url) return url;
      }
    }
  } catch { /* fall through */ }
  return null;
}

// ── Process one hero ──────────────────────────────────────────────────────────
async function processHero(name) {
  const slug = heroToSlug(name);
  const outPath = join(OUTPUT_DIR, `${slug}.webp`);

  if (existsSync(outPath)) {
    console.log(`  ⏭  ${name} — skipped (exists)`);
    return { name, slug, status: "skipped" };
  }

  const heroId = HERO_IDS[name];
  let imageUrl = null;

  if (heroId) {
    imageUrl = await getIconUrl(heroId);
  }

  if (!imageUrl) {
    // Fallback: parse the hero's wiki page to find the icon filename
    console.log(`    🔍 Searching wiki page for ${name}...`);
    imageUrl = await searchIconByName(name);
  }

  if (!imageUrl) {
    console.warn(`  ⚠️  ${name} — image URL not found`);
    return { name, slug, status: "not_found" };
  }

  try {
    const buffer = await fetchBuffer(imageUrl);
    if (buffer.length < 500) throw new Error(`Too small (${buffer.length}B)`);

    await sharp(buffer)
      .resize(SIZE, SIZE, { fit: "cover", position: "top" })
      .webp({ quality: 90, effort: 4 })
      .toFile(outPath);

    console.log(`  ✅  ${name} (ID: ${heroId ?? "?"}) → ${slug}.webp`);
    return { name, slug, status: "ok" };
  } catch (err) {
    console.error(`  ❌  ${name} — ${err.message}`);
    return { name, slug, status: "error", error: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`\n🎮 MLBB Hero Image Downloader v3`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`📐 Size: ${SIZE}×${SIZE}px WebP\n`);

  const results = { ok: [], skipped: [], not_found: [], error: [] };

  for (let i = 0; i < HEROES.length; i++) {
    const hero = HEROES[i];
    console.log(`[${i + 1}/${HEROES.length}] ${hero}`);
    const result = await processHero(hero);
    (results[result.status] ??= []).push(result.name);
    await sleep(DELAY_MS);
  }

  console.log("\n─────────────────────────────");
  console.log(`✅ Downloaded : ${results.ok?.length ?? 0}`);
  console.log(`⏭  Skipped   : ${results.skipped?.length ?? 0}`);
  console.log(`⚠️  Not found  : ${results.not_found?.length ?? 0}`);
  console.log(`❌ Errors     : ${results.error?.length ?? 0}`);

  if (results.not_found?.length) {
    console.log("\n⚠️  No image found for:");
    results.not_found.forEach((n) => console.log(`   - ${n}`));
  }
  if (results.error?.length) {
    console.log("\n❌ Failed:");
    results.error.forEach((n) => console.log(`   - ${n}`));
  }
  console.log("\n🎉 Done!\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
