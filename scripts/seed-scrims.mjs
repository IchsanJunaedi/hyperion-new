import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const admin = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ORG_ID   = "6f927d06-0ec7-4011-baec-c12ca815d49a";
const DIV_ID   = "99f8e0ba-ffc2-4bb6-9251-c0310a1521ec";
const COACH_ID = "50269c6e-bd45-4b56-9d5f-468f313f2313";
const OWNER_ID = "d864daf7-f713-4350-8b19-d72a127c5b60";

// Resolve Garry & Dewa IDs at runtime
const { data: extras } = await admin.from("profiles")
  .select("id, display_name").in("display_name", ["Garry", "Dewa"]);
const GARRY_ID = extras.find(p => p.display_name === "Garry")?.id;
const DEWA_ID  = extras.find(p => p.display_name === "Dewa")?.id;

const PLAYERS = {
  mid_lane:  "5bfcee54-e40e-4883-9dec-67749165ff2f", // Juned
  gold_lane: "ed019295-a569-4422-b9d8-1bbaebee2f8a", // Prit
  roamer:    "f8fa0533-f878-42fa-bd63-81c0934c513b", // Karung
  jungler:   GARRY_ID,
  exp_lane:  DEWA_ID,
};

// Hero comps — [exp, jungle, mid, gold, roam]
const OUR_COMPS = [
  { exp: "Yu Zhong",   jungle: "Karina",   mid: "Pharsa",   gold: "Beatrix", roam: "Atlas" },
  { exp: "Esmeralda",  jungle: "Lancelot", mid: "Kagura",   gold: "Bruno",   roam: "Khufra" },
  { exp: "Paquito",    jungle: "Ling",     mid: "Yve",      gold: "Wanwan",  roam: "Tigreal" },
  { exp: "Aldous",     jungle: "Gusion",   mid: "Lunox",    gold: "Claude",  roam: "Chou" },
  { exp: "Hilda",      jungle: "Fanny",    mid: "Harith",   gold: "Melissa", roam: "Edith" },
  { exp: "Thamuz",     jungle: "Julian",   mid: "Valentina",gold: "Irithel", roam: "Fredrinn" },
  { exp: "Freya",      jungle: "Hayabusa", mid: "Cecilion", gold: "Miya",    roam: "Franco" },
  { exp: "Khaleed",    jungle: "Alucard",  mid: "Novaria",  gold: "Layla",   roam: "Tigreal" },
];

const OPP_COMPS = [
  { exp: "Roger",      jungle: "Ling",     mid: "Kagura",   gold: "Karrie",  roam: "Atlas" },
  { exp: "Yu Zhong",   jungle: "Fanny",    mid: "Lunox",    gold: "Claude",  roam: "Khufra" },
  { exp: "Paquito",    jungle: "Karina",   mid: "Pharsa",   gold: "Beatrix", roam: "Chou" },
  { exp: "Esmeralda",  jungle: "Lancelot", mid: "Harith",   gold: "Wanwan",  roam: "Tigreal" },
  { exp: "Thamuz",     jungle: "Gusion",   mid: "Yve",      gold: "Bruno",   roam: "Edith" },
  { exp: "Aldous",     jungle: "Julian",   mid: "Valentina",gold: "Irithel", roam: "Atlas" },
  { exp: "Khaleed",    jungle: "Hayabusa", mid: "Novaria",  gold: "Miya",    roam: "Franco" },
  { exp: "Hilda",      jungle: "Alucard",  mid: "Cecilion", gold: "Layla",   roam: "Fredrinn" },
];

function makePicks(scrimId, gameNum, ourComp, oppComp) {
  const roles = ["exp_lane", "jungler", "mid_lane", "gold_lane", "roamer"];
  const ourHeroes  = [ourComp.exp, ourComp.jungle, ourComp.mid, ourComp.gold, ourComp.roam];
  const oppHeroes  = [oppComp.exp, oppComp.jungle, oppComp.mid, oppComp.gold, oppComp.roam];
  const playerKeys = ["exp_lane", "jungler", "mid_lane", "gold_lane", "roamer"];

  const picks = [];
  for (let i = 0; i < 5; i++) {
    picks.push({ scrim_id: scrimId, game_number: gameNum, hero_name: ourHeroes[i], role: roles[i], side: "our", player_id: PLAYERS[playerKeys[i]] });
    picks.push({ scrim_id: scrimId, game_number: gameNum, hero_name: oppHeroes[i], role: roles[i], side: "enemy", player_id: null });
  }
  return picks;
}

function makeBans(scrimId, gameNum) {
  const banned = [
    "Fanny", "Lancelot", "Ling", "Gusion", "Karina",
    "Atlas", "Khufra", "Chou", "Beatrix", "Wanwan",
  ];
  return banned.map((hero, i) => ({
    scrim_id: scrimId, game_number: gameNum, hero_name: hero,
    ban_order: i + 1, side: i % 2 === 0 ? "our" : "enemy",
  }));
}

function makeVod(scrimId, gameNum, coachId, notes) {
  return notes.map(({ secs, note, playerRole }) => ({
    scrim_id: scrimId, game_number: gameNum,
    timestamp_secs: secs, note,
    created_by: coachId,
    tagged_player_id: playerRole ? PLAYERS[playerRole] : null,
  }));
}

// 10 scrims across 5 days (2 per day)
const SCRIMS = [
  // Day 1 — 2026-05-26
  {
    opponent: "Alter Ego", scheduled: "2026-05-26T19:00:00+07:00",
    notes: "Scrim pertama minggu ini. Fokus pada rotasi early game dan vision control.",
    coach_summary: "Koordinasi rotasi jungler–mid masih perlu perbaikan. Dragon timing bagus di game 2.",
    vod_link: "https://youtu.be/alteregosc1",
    room_info: "Room ID: 12345 | Pass: hype",
    server_region: "ID",
    games: [
      { is_win: true,  notes: "Early game dominan, objektif terkontrol dengan baik." },
      { is_win: false, notes: "Kehabisan resources mid game, rotation terlambat ke turtle." },
      { is_win: true,  notes: "Comeback via lord steal di menit 18, mental bagus." },
    ],
    result: { our_score: 2, opp_score: 1, is_win: true, rating: 4,
      coach_notes: "Secara keseluruhan solid. Juned control mid lane sangat baik di game 1 dan 3. Garry perlu lebih proaktif invade jungle lawan.",
      notes: "Menang 2-1. Progres bagus untuk awal minggu." },
    vod_notes: {
      1: [
        { secs: 124,  note: "Garry invade level 2 berhasil, set up first blood untuk Juned.", playerRole: "jungler" },
        { secs: 310,  note: "Rotasi ke turtle kurang cepat, Dewa terlambat hadir.", playerRole: "exp_lane" },
        { secs: 540,  note: "Teamfight di river: positioning Karung sangat bagus, initiasi tepat.", playerRole: "roamer" },
      ],
      3: [
        { secs: 205,  note: "Prit positioning gold lane terlalu maju, hampir mati solo.", playerRole: "gold_lane" },
        { secs: 1080, note: "Lord steal Garry kritis — comeback dari situasi tertinggal 3-8.", playerRole: "jungler" },
      ],
    },
    comps: [
      { our: 0, opp: 0, side: "blue" },
      { our: 1, opp: 1, side: "red" },
      { our: 2, opp: 2, side: "blue" },
    ],
  },
  {
    opponent: "RRQ Hoshi", scheduled: "2026-05-26T21:30:00+07:00",
    notes: "Lawan lebih berpengalaman. Fokus pada macro game dan draft awareness.",
    coach_summary: "Draft phase masih reaktif, tidak ada strategi counter pick yang jelas. Perlu improve.",
    vod_link: "https://youtu.be/rrqsc1",
    room_info: "Room ID: 54321 | Pass: rrqhype",
    server_region: "ID",
    games: [
      { is_win: false, notes: "Draft kalah jauh, hero pool terbatas terlihat jelas di game ini." },
      { is_win: true,  notes: "Adjust draft, aggressive early game berhasil snowball." },
      { is_win: false, notes: "Late game team RRQ terlalu strong, scaling hero mereka dominan." },
    ],
    result: { our_score: 1, opp_score: 2, is_win: false, rating: 2,
      coach_notes: "Kekalahan valuable. Draft phase harus lebih dipersiapkan. Expand hero pool tiap player minimal 3 hero backup.",
      notes: "Kalah 1-2. Banyak pelajaran dari sini, terutama soal draft counter." },
    vod_notes: {
      2: [
        { secs: 89,   note: "Juned roam ke gold lane early — pressure ganda berhasil.", playerRole: "mid_lane" },
        { secs: 445,  note: "Dewa outplay 1v2 di exp lane, momentum shift.", playerRole: "exp_lane" },
      ],
      3: [
        { secs: 630,  note: "Lord terlalu dipaksakan saat tim tidak full HP, wasted respawn.", playerRole: null },
        { secs: 920,  note: "Karung hook miss di teamfight kritis, kehilangan momen.", playerRole: "roamer" },
      ],
    },
    comps: [
      { our: 3, opp: 3, side: "red" },
      { our: 4, opp: 4, side: "blue" },
      { our: 5, opp: 5, side: "red" },
    ],
  },

  // Day 2 — 2026-05-28
  {
    opponent: "Evos Legends", scheduled: "2026-05-28T19:00:00+07:00",
    notes: "Scrim fokus testing komposisi baru dengan Valentina mid.",
    coach_summary: "Komposisi Valentina mid sangat efektif. Perlu lebih banyak game untuk validasi.",
    vod_link: "https://youtu.be/evossc1",
    room_info: "Room ID: 11223 | Pass: evoshype",
    server_region: "ID",
    games: [
      { is_win: true,  notes: "Valentina steal ultimate Atlas sangat impactful di teamfight." },
      { is_win: true,  notes: "Full control dari early hingga late, objektif tidak pernah lepas." },
    ],
    result: { our_score: 2, opp_score: 0, is_win: true, rating: 5,
      coach_notes: "Penampilan terbaik sejauh ini. Sinergi Garry–Juned–Karung sangat on point. Pertahankan rotasi triangle ini.",
      notes: "Menang 2-0 clean sweep. Komposisi baru sangat menjanjikan." },
    vod_notes: {
      1: [
        { secs: 178,  note: "Juned Valentina steal Atlas ultimate — 5 man knockup berhasil.", playerRole: "mid_lane" },
        { secs: 390,  note: "Triangle rotate Garry–Juned–Karung sempurna, opponent terpecah.", playerRole: "jungler" },
      ],
      2: [
        { secs: 265,  note: "Prit free farming gold lane tanpa gangguan, lead gold +2000 menit 8.", playerRole: "gold_lane" },
        { secs: 510,  note: "Dewa zone 2 hero sekaligus di exp side, perfect split pressure.", playerRole: "exp_lane" },
      ],
    },
    comps: [
      { our: 5, opp: 6, side: "blue" },
      { our: 0, opp: 0, side: "blue" },
    ],
  },
  {
    opponent: "ONIC Esports", scheduled: "2026-05-28T21:30:00+07:00",
    notes: "ONIC lineup baru dengan Fanny jungler. Counter pick sangat penting.",
    coach_summary: "Kegagalan counter Fanny berulang kali. Wajib punya Fanny counter di hero pool.",
    vod_link: "https://youtu.be/onicsc1",
    room_info: "Room ID: 33445 | Pass: onichype",
    server_region: "ID",
    games: [
      { is_win: false, notes: "Fanny bebas roam, semua lane tertekan tanpa support dari jungle." },
      { is_win: false, notes: "Coba counter dengan Atlas chain, tetap tidak cukup karena damage kurang." },
    ],
    result: { our_score: 0, opp_score: 2, is_win: false, rating: 1,
      coach_notes: "Garry harus bisa main Chou untuk counter Fanny. Karung perlu lebih sering kasih vision di jungle lawan.",
      notes: "Kalah 0-2. Fanny problem harus diselesaikan sebelum turnamen." },
    vod_notes: {
      1: [
        { secs: 72,   note: "Fanny lawan bebas hadir ke mid menit 1:12, Garry tidak counter invade.", playerRole: "jungler" },
        { secs: 245,  note: "3 kill berturut-turut dari Fanny, snowball tidak terbendung.", playerRole: null },
      ],
      2: [
        { secs: 158,  note: "Karung ward tidak dipasang di jungle lawan, blind spot fatal.", playerRole: "roamer" },
        { secs: 490,  note: "Attempt counterpick Atlas chain terlambat, Fanny sudah terlalu fed.", playerRole: "roamer" },
      ],
    },
    comps: [
      { our: 1, opp: 1, side: "red" },
      { our: 2, opp: 7, side: "blue" },
    ],
  },

  // Day 3 — 2026-05-30
  {
    opponent: "Bigetron Alpha", scheduled: "2026-05-30T19:00:00+07:00",
    notes: "Rematch dari minggu lalu. Kali ini siap dengan draft yang lebih matang.",
    coach_summary: "Peningkatan signifikan pada late game decision making. Lord timing jauh lebih baik.",
    vod_link: "https://youtu.be/bigetronsc1",
    room_info: "Room ID: 55667 | Pass: bgthype",
    server_region: "ID",
    games: [
      { is_win: true,  notes: "Early snowball dari jungle side, tidak memberi ruang napas lawan." },
      { is_win: false, notes: "Lawan adapt draft, hero pilihannya sangat kuat di game ini." },
      { is_win: true,  notes: "Comeback setelah tertinggal 2-7, teamfight late game membalik keadaan." },
    ],
    result: { our_score: 2, opp_score: 1, is_win: true, rating: 4,
      coach_notes: "Mental bertanding membaik. Tidak panik saat tertinggal di game 3. Dewa outplay sangat konsisten hari ini.",
      notes: "Menang 2-1. Rematch berhasil. Tim makin solid." },
    vod_notes: {
      1: [
        { secs: 95,   note: "Garry early invade berhasil delay jungle lawan 2 camp.", playerRole: "jungler" },
        { secs: 320,  note: "Rotasi turtle perfect — 3 kill dan objektif.", playerRole: null },
      ],
      3: [
        { secs: 410,  note: "Dewa 1v1 outplay exp lane lawan yang sudah fed, sangat impressive.", playerRole: "exp_lane" },
        { secs: 875,  note: "Teamfight balik arah di menit 14:35 — semua alive setelah fight.", playerRole: null },
        { secs: 1150, note: "Final push execution bagus, tidak overextend.", playerRole: null },
      ],
    },
    comps: [
      { our: 6, opp: 2, side: "blue" },
      { our: 3, opp: 5, side: "red" },
      { our: 7, opp: 3, side: "blue" },
    ],
  },
  {
    opponent: "Aura Fire", scheduled: "2026-05-30T21:30:00+07:00",
    notes: "Aura lineup agresif. Test kemampuan bertahan early pressure.",
    coach_summary: "Defense under pressure sangat membaik. Tim tidak panik menghadapi early aggression.",
    vod_link: "https://youtu.be/aurasc1",
    room_info: "Room ID: 77889 | Pass: aurahype",
    server_region: "ID",
    games: [
      { is_win: true,  notes: "Bertahan dengan baik dari early gank, balik agresif di mid game." },
      { is_win: true,  notes: "Complete control, objektif sangat terjaga, tidak ada kesalahan berarti." },
    ],
    result: { our_score: 2, opp_score: 0, is_win: true, rating: 5,
      coach_notes: "2 clean sweep berturut-turut. Sinergi tim sangat bagus. Prit gold lane farming sangat efisien hari ini.",
      notes: "Menang 2-0. Performa terbaik minggu ini." },
    vod_notes: {
      1: [
        { secs: 134,  note: "Prit farming lane dengan sempurna, 0 cs wasted menit 0-5.", playerRole: "gold_lane" },
        { secs: 500,  note: "Defend tower sambil counter gank — Juned kill 3 dari rotasi cepat.", playerRole: "mid_lane" },
      ],
      2: [
        { secs: 190,  note: "Karung set up vision di semua jungle entry, zero blind spot.", playerRole: "roamer" },
        { secs: 620,  note: "Lord setup ideal — bait lawan masuk, langsung wipe 5-0.", playerRole: null },
      ],
    },
    comps: [
      { our: 0, opp: 4, side: "red" },
      { our: 4, opp: 6, side: "blue" },
    ],
  },

  // Day 4 — 2026-06-02
  {
    opponent: "Geek Fam ID", scheduled: "2026-06-02T19:00:00+07:00",
    notes: "Geek Fam dikenal dengan macro game. Perlu antisipasi objective-focused play.",
    coach_summary: "Terlalu terfokus teamfight, macro game kita masih kalah jauh dari Geek Fam.",
    vod_link: "https://youtu.be/geekfamsc1",
    room_info: "Room ID: 99001 | Pass: geekfamhype",
    server_region: "ID",
    games: [
      { is_win: true,  notes: "Game agresif dari awal, tidak beri waktu lawan setup macro mereka." },
      { is_win: false, notes: "Masuk fase late, macro game Geek Fam terlalu superior." },
      { is_win: false, notes: "Kehabisan pressure, lord call timing buruk di momen kritis." },
    ],
    result: { our_score: 1, opp_score: 2, is_win: false, rating: 2,
      coach_notes: "Kita butuh latihan macro game lebih intensif. Lord timing dan split push decision sangat perlu diperbaiki.",
      notes: "Kalah 1-2. Weakness di macro game terekspos hari ini." },
    vod_notes: {
      2: [
        { secs: 480,  note: "Lord call saat Dewa masih dead — 4v5 fight tidak harusnya dipaksakan.", playerRole: "exp_lane" },
        { secs: 750,  note: "Prit tidak recall tepat waktu, lawan free take tower gold side.", playerRole: "gold_lane" },
      ],
      3: [
        { secs: 560,  note: "Juned rotasi ke lord tapi mid lane open, trade objektif sangat merugikan.", playerRole: "mid_lane" },
        { secs: 840,  note: "Garry lord steal attempt terlambat 2 detik, tidak berhasil.", playerRole: "jungler" },
        { secs: 1050, note: "Teamfight dipaksakan saat HP tidak full, avoidable death.", playerRole: null },
      ],
    },
    comps: [
      { our: 2, opp: 0, side: "blue" },
      { our: 5, opp: 2, side: "red" },
      { our: 1, opp: 4, side: "blue" },
    ],
  },
  {
    opponent: "ECHO", scheduled: "2026-06-02T21:30:00+07:00",
    notes: "ECHO lineup muda tapi agresif. Test mental setelah kekalahan dari Geek Fam.",
    coach_summary: "Recovery mental sangat bagus. Tim tidak terbawa hasil buruk sebelumnya.",
    vod_link: "https://youtu.be/echosc1",
    room_info: "Room ID: 22334 | Pass: echohype",
    server_region: "ID",
    games: [
      { is_win: false, notes: "Start lambat, mental sedikit terbawa dari game sebelumnya." },
      { is_win: true,  notes: "Reset mindset, permainan jauh lebih tenang dan terkontrol." },
      { is_win: true,  notes: "Momentum terjaga, eksekusi draft baru sangat clean." },
    ],
    result: { our_score: 2, opp_score: 1, is_win: true, rating: 3,
      coach_notes: "Comeback 2-1 setelah game 1 buruk adalah tanda mental tim yang kuat. Dewa dan Garry synergy di game 3 luar biasa.",
      notes: "Menang 2-1. Bounce back dari kekalahan sebelumnya." },
    vod_notes: {
      2: [
        { secs: 145,  note: "Karung set initiasi pertama dengan Franco hook — perfect angle.", playerRole: "roamer" },
        { secs: 380,  note: "Juned roam ke gold lane, double kill set up Prit free push.", playerRole: "mid_lane" },
      ],
      3: [
        { secs: 220,  note: "Dewa–Garry dua lane pressure simultaneously, lawan tidak bisa respond.", playerRole: "exp_lane" },
        { secs: 590,  note: "Prit ultimate di teamfight sangat on point, wipe team ECHO 5-0.", playerRole: "gold_lane" },
      ],
    },
    comps: [
      { our: 3, opp: 1, side: "red" },
      { our: 6, opp: 5, side: "blue" },
      { our: 7, opp: 7, side: "red" },
    ],
  },

  // Day 5 — 2026-06-04
  {
    opponent: "Blacklist International", scheduled: "2026-06-04T19:00:00+07:00",
    notes: "Lawan terkuat minggu ini. PROTECT ULTI strategy Blacklist sangat terkenal.",
    coach_summary: "Kita tidak punya jawaban untuk PROTECT ULTI. Perlu develop counter strategy.",
    vod_link: "https://youtu.be/blacklistsc1",
    room_info: "Room ID: 44556 | Pass: blhype",
    server_region: "ID",
    games: [
      { is_win: false, notes: "Ulti carry Blacklist tidak ter-interrupt, damage terlalu overwhelming." },
      { is_win: false, notes: "Coba all-in assassin comp, tetap tidak berhasil tembus frontline mereka." },
    ],
    result: { our_score: 0, opp_score: 2, is_win: false, rating: 1,
      coach_notes: "Wajib develop PROTECT ULTI counter sebelum turnamen. Coba strategy dive hard dengan CC chain panjang.",
      notes: "Kalah 0-2. Respek untuk Blacklist, tapi ini jadi PR besar tim." },
    vod_notes: {
      1: [
        { secs: 310,  note: "Karung tidak bisa interrupt ulti carry Blacklist — timing CC meleset.", playerRole: "roamer" },
        { secs: 580,  note: "Team wipe karena fronline Blacklist terlalu solid, tidak ada celah.", playerRole: null },
      ],
      2: [
        { secs: 195,  note: "Garry coba invade early tapi frontline Blacklist block semua path.", playerRole: "jungler" },
        { secs: 445,  note: "Assassin comp tidak bisa penetrasi — ulti damage sudah terlalu tinggi.", playerRole: null },
      ],
    },
    comps: [
      { our: 4, opp: 0, side: "red" },
      { our: 3, opp: 3, side: "blue" },
    ],
  },
  {
    opponent: "Natus Vincere", scheduled: "2026-06-04T21:30:00+07:00",
    notes: "NaVi dari server SEA. Gaya main berbeda, lebih banyak split push.",
    coach_summary: "Adaptasi terhadap split push lawan sangat bagus. Rotasi defense tepat waktu.",
    vod_link: "https://youtu.be/navisc1",
    room_info: "Room ID: 66778 | Pass: navihype",
    server_region: "ID",
    games: [
      { is_win: true,  notes: "Counter split push dengan rotasi cepat, tidak beri tower gratis." },
      { is_win: true,  notes: "Capitalize early kills dari mid, snowball sangat terkontrol." },
    ],
    result: { our_score: 2, opp_score: 0, is_win: true, rating: 4,
      coach_notes: "Tutup hari dengan kemenangan bersih. Tim sangat adaptif terhadap gaya main berbeda. Bagus.",
      notes: "Menang 2-0. Penutup yang bagus untuk sesi scrim minggu ini." },
    vod_notes: {
      1: [
        { secs: 165,  note: "Deteksi split push lebih awal dari ward Karung — rotasi sempurna.", playerRole: "roamer" },
        { secs: 400,  note: "Juned 3 man rotation ke tower yang diserang, kill 2 dan save tower.", playerRole: "mid_lane" },
      ],
      2: [
        { secs: 250,  note: "First blood Prit + Garry combo gold–jungle — inisiasi dari river.", playerRole: "gold_lane" },
        { secs: 650,  note: "Lord take tanpa fight — lawan tidak berani keluar, menekan dengan sempurna.", playerRole: null },
      ],
    },
    comps: [
      { our: 2, opp: 6, side: "blue" },
      { our: 5, opp: 1, side: "red" },
    ],
  },
];

console.log("Inserting 10 scrims...\n");

for (const s of SCRIMS) {
  // Insert scrim
  const { data: scrim, error: scrimErr } = await admin.from("scrims").insert({
    organization_id: ORG_ID,
    division_id: DIV_ID,
    opponent_name: s.opponent,
    scheduled_at: s.scheduled,
    format: "bo3",
    status: "completed",
    notes: s.notes,
    vod_link: s.vod_link,
    room_info: s.room_info,
    server_region: s.server_region,
    created_by: OWNER_ID,
  }).select("id").single();

  if (scrimErr) { console.error(`Scrim error (${s.opponent}):`, scrimErr.message); continue; }
  const scrimId = scrim.id;
  console.log(`✓ Scrim vs ${s.opponent} [${scrimId}]`);

  // Game results
  for (let i = 0; i < s.games.length; i++) {
    const g = s.games[i];
    const { error: grErr } = await admin.from("scrim_game_results").insert({
      scrim_id: scrimId, game_number: i + 1, is_win: g.is_win, notes: g.notes,
    });
    if (grErr) console.error(`  Game ${i+1} result error:`, grErr.message);
  }
  console.log(`  ✓ ${s.games.length} game results`);

  // Scrim result
  const { error: srErr } = await admin.from("scrim_results").insert({
    scrim_id: scrimId,
    our_score: s.result.our_score,
    opponent_score: s.result.opp_score,
    is_win: s.result.is_win,
    performance_rating: s.result.rating,
    coach_notes: `${s.coach_summary}\n\n${s.result.coach_notes}`,
    notes: s.result.notes,
    recorded_by: COACH_ID,
  });
  if (srErr) console.error(`  Scrim result error:`, srErr.message);
  else console.log(`  ✓ Scrim result (${s.result.our_score}-${s.result.opp_score})`);

  // Draft picks per game
  let totalPicks = 0;
  for (let i = 0; i < s.comps.length; i++) {
    const c = s.comps[i];
    const picks = makePicks(scrimId, i + 1, OUR_COMPS[c.our], OPP_COMPS[c.opp], c.side);
    const { error: dpErr } = await admin.from("scrim_draft_picks").insert(picks);
    if (dpErr) console.error(`  Picks game ${i+1} error:`, dpErr.message);
    else totalPicks += picks.length;
  }
  console.log(`  ✓ ${totalPicks} draft picks`);

  // Draft bans per game
  let totalBans = 0;
  for (let i = 0; i < s.comps.length; i++) {
    const bans = makeBans(scrimId, i + 1);
    const { error: dbErr } = await admin.from("scrim_draft_bans").insert(bans);
    if (dbErr) console.error(`  Bans game ${i+1} error:`, dbErr.message);
    else totalBans += bans.length;
  }
  console.log(`  ✓ ${totalBans} draft bans`);

  // VOD timestamps
  let totalVod = 0;
  for (const [gameNum, notes] of Object.entries(s.vod_notes)) {
    const rows = makeVod(scrimId, parseInt(gameNum), COACH_ID, notes);
    const { error: vtErr } = await admin.from("scrim_vod_timestamps").insert(rows);
    if (vtErr) console.error(`  VOD game ${gameNum} error:`, vtErr.message);
    else totalVod += rows.length;
  }
  console.log(`  ✓ ${totalVod} VOD timestamps\n`);
}

console.log("Done. 10 scrims seeded.");
