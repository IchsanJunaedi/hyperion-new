-- gallery_entries replaces lib/data/gallery.ts
CREATE TABLE gallery_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  division text NOT NULL,
  tournament_date text NOT NULL,
  position text NOT NULL,
  status text NOT NULL DEFAULT 'Online',
  logo_url text,
  preview_images text[] DEFAULT '{}',
  description text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active bool NOT NULL DEFAULT true
);

CREATE TABLE testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_role text NOT NULL,
  content text NOT NULL,
  avatar_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active bool NOT NULL DEFAULT true
);

CREATE TABLE divisions_public (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active bool NOT NULL DEFAULT true
);

CREATE TABLE site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read gallery_entries" ON gallery_entries FOR SELECT USING (true);
CREATE POLICY "public read partners" ON partners FOR SELECT USING (true);
CREATE POLICY "public read testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "public read divisions_public" ON divisions_public FOR SELECT USING (true);
CREATE POLICY "public read site_settings" ON site_settings FOR SELECT USING (true);

-- Seed gallery_entries
INSERT INTO gallery_entries (slug, title, division, tournament_date, position, status, preview_images, description, sort_order) VALUES
('liga-esport-nasional-pelajar-2024', 'Liga Esport Nasional Pelajar 2024', 'Mobile Legends: Bang Bang', '2024', '#1 National', 'Online', ARRAY['https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg'], 'Ini dia SANG JUARA LIGA ESPORTS NASIONAL PELAJAR 2024 - MOBILE LEGENDS. Perjuangan keras tidak mengkhianati hasil dari kerjasama tim. Tetap semangat dan semoga bisa terus mendapatkan juara.', 0),
('rrq-mabar-esports-tournament-season-4', 'RRQ MABAR Esports Tournament Season 4', 'Mobile Legends: Bang Bang', '2024', 'Champion', 'Online', ARRAY['https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg'], 'Ribuan pelajar telah bertanding di RRQ MABAR Esports Tournament Season 4 dan inilah juaranya! SMAS Xaverius 1 Palembang berhasil raih back to back champion setelah menang 3-1 di Grand Final melawan SMAK Yos Sudarso Batam.', 1),
('h3ro-rookie-tournament-4', 'H3RO ROOKIE TOURNAMENT 4.0', 'Mobile Legends: Bang Bang', '2023', 'Champion', 'Offline', ARRAY['https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg'], 'H3RO Esports 4.0 is the 4th edition of the event organized by H3RO. Champion qualifies to Seleknas IESF 2023.', 2);

-- Seed partners
INSERT INTO partners (name, logo_url, sort_order) VALUES
('Partner 1', 'https://hyperionteam.id/storage/partners/01JZPD66GVYZ3V64K59DENV86X.png', 0),
('Partner 2', 'https://hyperionteam.id/storage/partners/01JZPD6FE6CJ4STMBZ92BG6905.png', 1),
('Partner 3', 'https://hyperionteam.id/storage/partners/01JZPD6QMPNEBTFH83S9DR2WRP.png', 2),
('Partner 4', 'https://hyperionteam.id/storage/partners/01JZPD9BMKXCYRFWJMS4JSSC4S.png', 3),
('Partner 5', 'https://hyperionteam.id/storage/partners/01JZPD7F8KJ673VNKC4Y1TMJRY.png', 4),
('Partner 6', 'https://hyperionteam.id/storage/partners/01JZPD7TAM6H93H9XG56ST7H9Q.png', 5),
('Partner 7', 'https://hyperionteam.id/storage/partners/01JZPD89RJXEARGPW11RNCHTDV.png', 6),
('Partner 8', 'https://hyperionteam.id/storage/partners/01JZPD8PBS7TAJ9AWVKCHQKT75.png', 7);

-- Seed testimonials
INSERT INTO testimonials (author_name, author_role, content, avatar_url, sort_order) VALUES
('RRQ Kaeya', 'Player of Team RRQ', 'Awalnya gue kira bakal biasa aja kayak komunitas lain, tapi ternyata banyak ilmu yang gue dapet dari awal trial sampai akhir. Di Hyperion, gue ketemu banyak orang yang semangat kompetisinya sama, jadi lebih enak buat berkembang. Sering scrim dan ada evaluasi via Discord yang bikin gameplay makin bagus.', 'https://hyperionteam.id/storage/testimonials/01K2SMTH386QV9Q3R8PTF7913YR.png', 0),
('Evos Rendyy', 'Team of Evos Esports', 'Gue mulai bareng Hyperion BLCK di awal 2023 dan berhasil juara di banyak turnamen nasional pelajar. Setelah itu gue lanjut bareng Hyperion Palembang di DGWIB 2024 bersama Fenzu. Buat gue, Hyperion adalah titik awal perjalanan gue di scene profesional.', 'https://hyperionteam.id/storage/testimonials/01K2RYQS6A36J458VGK7DE8AS9.png', 1),
('Pajajaran Firlyboy', 'Player of Team Pajajaran', 'Hyperion jadi titik awal penting buat perjalanan gue di esports. Di sini gue nggak cuma belajar mekanik, tapi juga disiplin, mindset, dan cara bersaing sehat. Semua itu ngebantu banget waktu gue masuk ke Seleknas Pajajaran 2024.', 'https://hyperionteam.id/storage/testimonials/01K2RYVPWSFF8GGREVCD4VKRRH.png', 2);

-- Seed site_settings
INSERT INTO site_settings (key, value) VALUES
('hero_eyebrow', 'Est. 2020 — Palembang, Indonesia'),
('hero_tagline', 'Empowering Young Talents to Rise and Rule.'),
('hero_cta_label', 'Join Us'),
('hero_cta_href', '/register'),
('footer_tagline', 'Empowering Young Talents to Rise and Rule. Est. 2020 — Palembang, Indonesia.'),
('footer_instagram_handle', '@hyperionteam.id'),
('footer_instagram_url', 'https://www.instagram.com/hyperionteam.id/'),
('footer_hashtag', '#HypeWin'),
('join_eyebrow', '#HypeWin'),
('join_title_line1', 'Ready To'),
('join_title_line2', 'Join The Team?'),
('join_description', 'Unleash your potential. Kembangkan skill, bangun karir esports, dan jadilah bagian dari keluarga Hyperion Team.'),
('join_fine_print', 'Gratis · Tanpa syarat umur minimum');

-- Supabase Storage bucket for public assets
INSERT INTO storage.buckets (id, name, public) VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read public-assets" ON storage.objects FOR SELECT USING (bucket_id = 'public-assets');
CREATE POLICY "authenticated upload public-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-assets' AND auth.role() = 'authenticated');
CREATE POLICY "authenticated update public-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'public-assets' AND auth.role() = 'authenticated');
CREATE POLICY "authenticated delete public-assets" ON storage.objects FOR DELETE USING (bucket_id = 'public-assets' AND auth.role() = 'authenticated');
