-- =============================================================================
-- 20260510000001_init_schema.sql
-- Enum types + base tables + indexes for EsportsOS.
-- Mirrors new-project/02_database_schema.md.
-- RLS, helper functions, JWT hook, storage and pg_cron live in later
-- migrations so this file is only structural.
-- =============================================================================

-- Postgres extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE org_tier AS ENUM ('pelajar', 'komunitas', 'pro');

CREATE TYPE member_role AS ENUM (
  'owner', 'captain', 'member', 'coach', 'manager'
);

CREATE TYPE scrim_status AS ENUM (
  'scheduled', 'ongoing', 'completed', 'cancelled'
);

CREATE TYPE match_format AS ENUM ('bo1', 'bo3', 'bo5', 'scrimmage');

CREATE TYPE attendance_status AS ENUM (
  'confirmed', 'declined', 'tentative', 'pending'
);

CREATE TYPE notification_status AS ENUM (
  'pending', 'sent', 'failed', 'read'
);

CREATE TYPE notification_type AS ENUM (
  'scrim_invite', 'scrim_reminder', 'announcement',
  'result', 'invite', 'system'
);

CREATE TYPE invite_status AS ENUM (
  'pending', 'accepted', 'rejected', 'expired'
);

CREATE TYPE visibility AS ENUM ('public', 'division', 'private');

-- =============================================================================
-- TABLES
-- =============================================================================

-- organizations -----------------------------------------------------------------
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
  game_focus    TEXT[],
  social_links  JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_domain
  ON organizations(custom_domain)
  WHERE custom_domain IS NOT NULL;

-- profiles ----------------------------------------------------------------------
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  phone_wa      TEXT,
  game_ids      JSONB NOT NULL DEFAULT '{}'::jsonb,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- divisions ---------------------------------------------------------------------
CREATE TABLE divisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  game            TEXT NOT NULL,
  description     TEXT,
  logo_url        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE INDEX idx_divisions_org ON divisions(organization_id);

-- team_members ------------------------------------------------------------------
CREATE TABLE team_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            member_role NOT NULL DEFAULT 'member',
  jersey_number   SMALLINT,
  position        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, division_id)
);

CREATE INDEX idx_team_members_org ON team_members(organization_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_division ON team_members(division_id);

-- scrims ------------------------------------------------------------------------
CREATE TABLE scrims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  opponent_name   TEXT NOT NULL,
  opponent_contact TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  format          match_format NOT NULL DEFAULT 'bo3',
  status          scrim_status NOT NULL DEFAULT 'scheduled',
  server_region   TEXT,
  room_info       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scrims_org ON scrims(organization_id);
CREATE INDEX idx_scrims_division ON scrims(division_id);
CREATE INDEX idx_scrims_scheduled ON scrims(scheduled_at);
CREATE INDEX idx_scrims_status ON scrims(status);

-- scrim_attendances -------------------------------------------------------------
CREATE TABLE scrim_attendances (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id   UUID NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     attendance_status NOT NULL DEFAULT 'pending',
  note       TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scrim_id, user_id)
);

CREATE INDEX idx_attendance_scrim ON scrim_attendances(scrim_id);
CREATE INDEX idx_attendance_user ON scrim_attendances(user_id);

-- scrim_results -----------------------------------------------------------------
CREATE TABLE scrim_results (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id           UUID NOT NULL UNIQUE REFERENCES scrims(id) ON DELETE CASCADE,
  our_score          SMALLINT NOT NULL DEFAULT 0,
  opponent_score     SMALLINT NOT NULL DEFAULT 0,
  is_win             BOOLEAN,
  notes              TEXT,
  performance_rating SMALLINT CHECK (performance_rating BETWEEN 1 AND 5),
  recorded_by        UUID NOT NULL REFERENCES auth.users(id),
  recorded_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tournaments -------------------------------------------------------------------
CREATE TABLE tournaments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id      UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  organizer        TEXT,
  start_date       DATE NOT NULL,
  end_date         DATE,
  prize_pool       TEXT,
  registration_url TEXT,
  status           scrim_status NOT NULL DEFAULT 'scheduled',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tournaments_org ON tournaments(organization_id);
CREATE INDEX idx_tournaments_division ON tournaments(division_id);

-- tournament_results ------------------------------------------------------------
CREATE TABLE tournament_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL UNIQUE REFERENCES tournaments(id) ON DELETE CASCADE,
  placement     SMALLINT,
  prize_earned  TEXT,
  notes         TEXT,
  recorded_by   UUID REFERENCES auth.users(id),
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- calendar_events ---------------------------------------------------------------
CREATE TABLE calendar_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  description     TEXT,
  event_type      TEXT NOT NULL DEFAULT 'other'
                  CHECK (event_type IN ('scrim','tournament','practice','meeting','other')),
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  is_all_day      BOOLEAN NOT NULL DEFAULT false,
  location        TEXT,
  ref_id          UUID,
  ref_type        TEXT CHECK (ref_type IS NULL OR ref_type IN ('scrim','tournament')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_org ON calendar_events(organization_id);
CREATE INDEX idx_calendar_starts ON calendar_events(starts_at);

-- announcements -----------------------------------------------------------------
CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  is_pinned       BOOLEAN NOT NULL DEFAULT false,
  send_wa_blast   BOOLEAN NOT NULL DEFAULT false,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_org ON announcements(organization_id);

-- notifications -----------------------------------------------------------------
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  ref_id          UUID,
  ref_type        TEXT,
  status          notification_status NOT NULL DEFAULT 'pending',
  wa_number       TEXT,
  wa_message      TEXT,
  attempts        SMALLINT NOT NULL DEFAULT 0,
  last_error      TEXT,
  sent_at         TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_org ON notifications(organization_id);
CREATE INDEX idx_notifications_pending
  ON notifications(status, created_at)
  WHERE status = 'pending' AND wa_number IS NOT NULL;
CREATE INDEX idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- strategy_notes ----------------------------------------------------------------
CREATE TABLE strategy_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  visibility      visibility NOT NULL DEFAULT 'division',
  is_pinned       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_strategy_notes_org ON strategy_notes(organization_id);
CREATE INDEX idx_strategy_notes_division ON strategy_notes(division_id);

-- files -------------------------------------------------------------------------
CREATE TABLE files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  uploaded_by     UUID NOT NULL REFERENCES auth.users(id),
  bucket_name     TEXT NOT NULL CHECK (bucket_name IN ('org-logos','org-private','avatars')),
  storage_path    TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL,
  file_size       BIGINT NOT NULL CHECK (file_size >= 0),
  ref_id          UUID,
  ref_type        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_org ON files(organization_id);

-- achievements ------------------------------------------------------------------
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

-- organization_invites ----------------------------------------------------------
CREATE TABLE organization_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID REFERENCES divisions(id) ON DELETE SET NULL,
  invited_by      UUID NOT NULL REFERENCES auth.users(id),
  email           TEXT,
  phone_wa        TEXT,
  role            member_role NOT NULL DEFAULT 'member',
  token           TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  status          invite_status NOT NULL DEFAULT 'pending',
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone_wa IS NOT NULL)
);

CREATE INDEX idx_invites_token ON organization_invites(token);
CREATE INDEX idx_invites_org ON organization_invites(organization_id);
CREATE INDEX idx_invites_pending
  ON organization_invites(organization_id, status)
  WHERE status = 'pending';

-- =============================================================================
-- updated_at TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_scrims_updated_at
  BEFORE UPDATE ON scrims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_scrim_attendances_updated_at
  BEFORE UPDATE ON scrim_attendances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_strategy_notes_updated_at
  BEFORE UPDATE ON strategy_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- AUTO-PROVISION profiles ON auth.users INSERT
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone_wa)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone_wa'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
