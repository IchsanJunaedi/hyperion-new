# EsportsOS — Database Schema

## Enum Types

```sql
-- Tier organisasi
CREATE TYPE org_tier AS ENUM ('pelajar', 'komunitas', 'pro');

-- Role anggota dalam tim/divisi
CREATE TYPE member_role AS ENUM ('owner', 'captain', 'member', 'coach', 'manager');

-- Status scrim
CREATE TYPE scrim_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

-- Format scrim/tournament
CREATE TYPE match_format AS ENUM ('bo1', 'bo3', 'bo5', 'scrimmage');

-- Status konfirmasi hadir
CREATE TYPE attendance_status AS ENUM ('confirmed', 'declined', 'tentative', 'pending');

-- Status notifikasi
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'read');

-- Tipe notifikasi
CREATE TYPE notification_type AS ENUM ('scrim_invite', 'scrim_reminder', 'announcement', 'result', 'invite', 'system');

-- Status undangan
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Visibilitas file/strategi
CREATE TYPE visibility AS ENUM ('public', 'division', 'private');
```

---

## Tables

### `organizations`
```sql
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  tier          org_tier NOT NULL DEFAULT 'pelajar',
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  logo_url      TEXT,
  banner_url    TEXT,
  description   TEXT,
  game_focus    TEXT[], -- ['MLBB', 'Valorant']
  social_links  JSONB DEFAULT '{}', -- {instagram, twitter, youtube}
  is_public     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_domain ON organizations(custom_domain) WHERE custom_domain IS NOT NULL;
```

### `profiles`
```sql
-- Extend auth.users Supabase
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  phone_wa      TEXT, -- nomor WA untuk notifikasi
  game_ids      JSONB DEFAULT '{}', -- {mlbb: '123456789', valorant: 'tag#123'}
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_username ON profiles(username);
```

### `divisions`
```sql
CREATE TABLE divisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL, -- 'MLBB', 'Valorant', 'PUBG Mobile'
  slug            TEXT NOT NULL,
  game            TEXT NOT NULL,
  description     TEXT,
  logo_url        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_divisions_org ON divisions(organization_id);
```

### `team_members`
```sql
CREATE TABLE team_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            member_role NOT NULL DEFAULT 'member',
  jersey_number   SMALLINT,
  position        TEXT, -- 'Jungler', 'EXP Lane', 'IGL'
  is_active       BOOLEAN NOT NULL DEFAULT true,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id, division_id)
);

CREATE INDEX idx_team_members_org ON team_members(organization_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_division ON team_members(division_id);
```

### `scrims`
```sql
CREATE TABLE scrims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  opponent_name   TEXT NOT NULL,
  opponent_contact TEXT, -- WA/discord kontak lawan
  scheduled_at    TIMESTAMPTZ NOT NULL,
  format          match_format NOT NULL DEFAULT 'bo3',
  status          scrim_status NOT NULL DEFAULT 'scheduled',
  server_region   TEXT, -- 'ID', 'SG'
  room_info       TEXT, -- room ID/password jika ada
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scrims_org ON scrims(organization_id);
CREATE INDEX idx_scrims_division ON scrims(division_id);
CREATE INDEX idx_scrims_scheduled ON scrims(scheduled_at);
CREATE INDEX idx_scrims_status ON scrims(status);
```

### `scrim_attendances`
```sql
CREATE TABLE scrim_attendances (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id  UUID NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status    attendance_status NOT NULL DEFAULT 'pending',
  note      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scrim_id, user_id)
);

CREATE INDEX idx_attendance_scrim ON scrim_attendances(scrim_id);
CREATE INDEX idx_attendance_user ON scrim_attendances(user_id);
```

### `scrim_results`
```sql
CREATE TABLE scrim_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id        UUID NOT NULL UNIQUE REFERENCES scrims(id) ON DELETE CASCADE,
  our_score       SMALLINT NOT NULL DEFAULT 0,
  opponent_score  SMALLINT NOT NULL DEFAULT 0,
  is_win          BOOLEAN,
  notes           TEXT,
  performance_rating SMALLINT CHECK (performance_rating BETWEEN 1 AND 5),
  recorded_by     UUID NOT NULL REFERENCES auth.users(id),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `tournaments`
```sql
CREATE TABLE tournaments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  organizer       TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  prize_pool      TEXT,
  registration_url TEXT,
  status          scrim_status NOT NULL DEFAULT 'scheduled',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tournaments_org ON tournaments(organization_id);
CREATE INDEX idx_tournaments_division ON tournaments(division_id);
```

### `tournament_results`
```sql
CREATE TABLE tournament_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  UUID NOT NULL UNIQUE REFERENCES tournaments(id) ON DELETE CASCADE,
  placement      SMALLINT, -- 1 = juara
  prize_earned   TEXT,
  notes          TEXT,
  recorded_by    UUID REFERENCES auth.users(id),
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `calendar_events`
```sql
CREATE TABLE calendar_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  description     TEXT,
  event_type      TEXT NOT NULL DEFAULT 'other', -- 'scrim', 'tournament', 'practice', 'meeting', 'other'
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  is_all_day      BOOLEAN NOT NULL DEFAULT false,
  location        TEXT,
  ref_id          UUID, -- FK ke scrims.id atau tournaments.id (polymorphic)
  ref_type        TEXT, -- 'scrim' | 'tournament'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_org ON calendar_events(organization_id);
CREATE INDEX idx_calendar_starts ON calendar_events(starts_at);
```

### `announcements`
```sql
CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL, -- NULL = semua divisi
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  is_pinned       BOOLEAN NOT NULL DEFAULT false,
  send_wa_blast   BOOLEAN NOT NULL DEFAULT false,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_org ON announcements(organization_id);
```

### `notifications`
```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  ref_id          UUID, -- ID entitas terkait (scrim, announcement, dll)
  ref_type        TEXT,
  status          notification_status NOT NULL DEFAULT 'pending',
  wa_number       TEXT, -- nomor WA tujuan
  wa_message      TEXT, -- pesan WA yang dikirim
  sent_at         TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'pending';
CREATE INDEX idx_notifications_org ON notifications(organization_id);
```

### `strategy_notes`
```sql
CREATE TABLE strategy_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  content         TEXT NOT NULL, -- Markdown/rich text
  tags            TEXT[] DEFAULT '{}', -- ['rotation', 'early-game', 'push']
  visibility      visibility NOT NULL DEFAULT 'division',
  is_pinned       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_strategy_notes_org ON strategy_notes(organization_id);
CREATE INDEX idx_strategy_notes_division ON strategy_notes(division_id);
```

### `files`
```sql
CREATE TABLE files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  uploaded_by     UUID NOT NULL REFERENCES auth.users(id),
  bucket_name     TEXT NOT NULL, -- 'org-private' atau 'org-public'
  storage_path    TEXT NOT NULL, -- path di Supabase Storage
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL, -- MIME type
  file_size       BIGINT NOT NULL, -- bytes
  ref_id          UUID, -- FK ke entitas terkait (scrim, strategy_note, dll)
  ref_type        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_org ON files(organization_id);
```

### `achievements`
```sql
CREATE TABLE achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  achieved_at     DATE NOT NULL,
  tournament_id   UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  placement       SMALLINT,
  image_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_achievements_org ON achievements(organization_id);
```

### `organization_invites`
```sql
CREATE TABLE organization_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  invited_by      UUID NOT NULL REFERENCES auth.users(id),
  email           TEXT,
  phone_wa        TEXT,
  role            member_role NOT NULL DEFAULT 'member',
  token           TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status          invite_status NOT NULL DEFAULT 'pending',
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_token ON organization_invites(token);
CREATE INDEX idx_invites_org ON organization_invites(organization_id);
```

---

## Row Level Security (RLS) Policies

### Helper Functions

```sql
-- Cek apakah user adalah member aktif org
CREATE OR REPLACE FUNCTION is_member_of(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Ambil role user dalam org
CREATE OR REPLACE FUNCTION get_member_role(org_id UUID)
RETURNS member_role AS $$
  SELECT role FROM team_members
  WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Cek apakah user adalah owner/captain org
CREATE OR REPLACE FUNCTION is_captain_or_above(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'captain', 'manager')
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### organizations RLS

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Siapa pun bisa lihat org yang public
CREATE POLICY "org_select_public" ON organizations
  FOR SELECT USING (is_public = true OR is_member_of(id));

-- Hanya owner yang bisa update org mereka
CREATE POLICY "org_update_owner" ON organizations
  FOR UPDATE USING (owner_id = auth.uid());

-- Siapa pun bisa insert (buat org baru)
CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());
```

### team_members RLS

```sql
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Member bisa lihat semua anggota dalam org yang sama
CREATE POLICY "tm_select_member" ON team_members
  FOR SELECT USING (is_member_of(organization_id));

-- Hanya owner/captain yang bisa tambah member
CREATE POLICY "tm_insert_captain" ON team_members
  FOR INSERT WITH CHECK (is_captain_or_above(organization_id));

-- Owner/captain bisa update member
CREATE POLICY "tm_update_captain" ON team_members
  FOR UPDATE USING (is_captain_or_above(organization_id));

-- Owner bisa hapus member; user bisa keluar sendiri
CREATE POLICY "tm_delete" ON team_members
  FOR DELETE USING (
    get_member_role(organization_id) = 'owner'
    OR user_id = auth.uid()
  );
```

### scrims RLS

```sql
ALTER TABLE scrims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scrims_select" ON scrims
  FOR SELECT USING (is_member_of(organization_id));

CREATE POLICY "scrims_insert" ON scrims
  FOR INSERT WITH CHECK (is_captain_or_above(organization_id));

CREATE POLICY "scrims_update" ON scrims
  FOR UPDATE USING (is_captain_or_above(organization_id));

CREATE POLICY "scrims_delete" ON scrims
  FOR DELETE USING (is_captain_or_above(organization_id));
```

### scrim_attendances RLS

```sql
ALTER TABLE scrim_attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select" ON scrim_attendances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id AND is_member_of(s.organization_id)
    )
  );

-- User hanya bisa update attendance miliknya sendiri
CREATE POLICY "attendance_upsert_self" ON scrim_attendances
  FOR ALL USING (user_id = auth.uid());
```

### notifications RLS

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User hanya lihat notifikasi miliknya
CREATE POLICY "notif_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notif_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
```

### strategy_notes RLS

```sql
ALTER TABLE strategy_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "strategy_select" ON strategy_notes
  FOR SELECT USING (
    is_member_of(organization_id) AND (
      visibility = 'division'
      OR (visibility = 'private' AND created_by = auth.uid())
      OR visibility = 'public'
    )
  );

CREATE POLICY "strategy_insert" ON strategy_notes
  FOR INSERT WITH CHECK (is_member_of(organization_id));

CREATE POLICY "strategy_update" ON strategy_notes
  FOR UPDATE USING (
    created_by = auth.uid() OR is_captain_or_above(organization_id)
  );
```

### files, announcements, calendar_events, achievements, tournaments

```sql
-- Pola yang sama: SELECT hanya member, INSERT/UPDATE hanya captain ke atas
-- (apply untuk: files, announcements, calendar_events, achievements, tournaments, tournament_results)

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files_select" ON files FOR SELECT USING (is_member_of(organization_id));
CREATE POLICY "files_insert" ON files FOR INSERT WITH CHECK (is_member_of(organization_id));

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_select" ON announcements FOR SELECT USING (is_member_of(organization_id));
CREATE POLICY "ann_insert" ON announcements FOR INSERT WITH CHECK (is_captain_or_above(organization_id));
CREATE POLICY "ann_update" ON announcements FOR UPDATE USING (is_captain_or_above(organization_id));

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cal_select" ON calendar_events FOR SELECT USING (is_member_of(organization_id));
CREATE POLICY "cal_insert" ON calendar_events FOR INSERT WITH CHECK (is_captain_or_above(organization_id));

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach_select" ON achievements FOR SELECT USING (is_member_of(organization_id));
CREATE POLICY "ach_insert" ON achievements FOR INSERT WITH CHECK (is_captain_or_above(organization_id));

ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite_select_own" ON organization_invites
  FOR SELECT USING (invited_by = auth.uid() OR is_captain_or_above(organization_id));
CREATE POLICY "invite_insert" ON organization_invites
  FOR INSERT WITH CHECK (is_captain_or_above(organization_id));
```
