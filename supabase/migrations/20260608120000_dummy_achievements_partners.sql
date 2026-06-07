-- Fix partner logo URLs + add 3 dummy achievements

-- Partners: set logo to local placeholder
UPDATE partners SET logo_url = '/brand/logo.jpg';

-- 3 dummy achievements (scoped to first org in DB)
INSERT INTO achievements (organization_id, title, description, achieved_at, placement, image_url)
SELECT
  id,
  'Juara 1 MPL Indonesia Season 14',
  'Tim Mobile Legends Hyperion berhasil mengalahkan EVOS Legends di grand final dengan skor 3-1.',
  '2026-03-15',
  1,
  '/brand/logo.jpg'
FROM organizations LIMIT 1;

INSERT INTO achievements (organization_id, title, description, achieved_at, placement, image_url)
SELECT
  id,
  'Runner Up FFWS SEA 2026',
  'Divisi Free Fire Hyperion menembus grand final FFWS SEA dan meraih posisi Runner Up.',
  '2026-04-20',
  2,
  '/brand/logo.jpg'
FROM organizations LIMIT 1;

INSERT INTO achievements (organization_id, title, description, achieved_at, placement, image_url)
SELECT
  id,
  'Juara 3 PUBG Mobile Open Championship',
  'Divisi PUBG Mobile Hyperion berhasil meraih podium ketiga di turnamen open championship nasional.',
  '2026-05-10',
  3,
  '/brand/logo.jpg'
FROM organizations LIMIT 1;
