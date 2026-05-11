/**
 * Hand-written Supabase Database type. Will be replaced by the
 * auto-generated output of `npm run db:types` once the migrations are
 * applied to the live Supabase project. The shape mirrors the
 * `supabase gen types typescript` output so consumers don't need to
 * change when we swap in the generated file.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrgTier = "pelajar" | "komunitas" | "pro";
export type MemberRole =
  | "owner"
  | "captain"
  | "member"
  | "coach"
  | "manager";
export type ScrimStatus = "scheduled" | "ongoing" | "completed" | "cancelled";
export type MatchFormat = "bo1" | "bo3" | "bo5" | "scrimmage";
export type AttendanceStatus =
  | "confirmed"
  | "declined"
  | "tentative"
  | "pending";
export type NotificationStatus = "pending" | "sent" | "failed" | "read";
export type NotificationType =
  | "scrim_invite"
  | "scrim_reminder"
  | "announcement"
  | "result"
  | "invite"
  | "system";
export type InviteStatus = "pending" | "accepted" | "rejected" | "expired";
export type Visibility = "public" | "division" | "private";

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  tier: OrgTier;
  owner_id: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  game_focus: string[] | null;
  social_links: Json;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone_wa: string | null;
  game_ids: Json;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type DivisionRow = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  game: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
};

type TeamMemberRow = {
  id: string;
  organization_id: string;
  division_id: string | null;
  user_id: string;
  role: MemberRole;
  jersey_number: number | null;
  position: string | null;
  is_active: boolean;
  joined_at: string;
};

type OrganizationInviteRow = {
  id: string;
  organization_id: string;
  division_id: string | null;
  invited_by: string;
  email: string | null;
  phone_wa: string | null;
  role: MemberRole;
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
};

type ScrimRow = {
  id: string;
  organization_id: string;
  division_id: string;
  created_by: string;
  opponent_name: string;
  opponent_contact: string | null;
  scheduled_at: string;
  format: MatchFormat;
  status: ScrimStatus;
  server_region: string | null;
  room_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ScrimAttendanceRow = {
  id: string;
  scrim_id: string;
  user_id: string;
  status: AttendanceStatus;
  note: string | null;
  updated_at: string;
};

type ScrimResultRow = {
  id: string;
  scrim_id: string;
  our_score: number;
  opponent_score: number;
  is_win: boolean | null;
  notes: string | null;
  performance_rating: number | null;
  recorded_by: string;
  recorded_at: string;
};

type AnnouncementRow = {
  id: string;
  organization_id: string;
  division_id: string | null;
  created_by: string;
  title: string;
  body: string;
  is_pinned: boolean;
  send_wa_blast: boolean;
  published_at: string | null;
  created_at: string;
};

type NotificationRow = {
  id: string;
  organization_id: string | null;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  ref_id: string | null;
  ref_type: string | null;
  status: NotificationStatus;
  wa_number: string | null;
  wa_message: string | null;
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
};

type CalendarEventRow = {
  id: string;
  organization_id: string;
  division_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  event_type: "scrim" | "tournament" | "practice" | "meeting" | "other";
  starts_at: string;
  ends_at: string | null;
  is_all_day: boolean;
  location: string | null;
  ref_id: string | null;
  ref_type: "scrim" | "tournament" | null;
  created_at: string;
};

type WithoutGenerated<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: OrganizationRow;
        Insert: WithoutGenerated<
          OrganizationRow,
          | "id"
          | "logo_url"
          | "banner_url"
          | "description"
          | "custom_domain"
          | "game_focus"
          | "social_links"
          | "is_public"
          | "tier"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<OrganizationRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: WithoutGenerated<
          ProfileRow,
          | "username"
          | "display_name"
          | "avatar_url"
          | "phone_wa"
          | "game_ids"
          | "bio"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      divisions: {
        Row: DivisionRow;
        Insert: WithoutGenerated<
          DivisionRow,
          | "id"
          | "description"
          | "logo_url"
          | "is_active"
          | "created_at"
        >;
        Update: Partial<DivisionRow>;
        Relationships: [];
      };
      team_members: {
        Row: TeamMemberRow;
        Insert: WithoutGenerated<
          TeamMemberRow,
          | "id"
          | "division_id"
          | "role"
          | "jersey_number"
          | "position"
          | "is_active"
          | "joined_at"
        >;
        Update: Partial<TeamMemberRow>;
        Relationships: [];
      };
      organization_invites: {
        Row: OrganizationInviteRow;
        Insert: WithoutGenerated<
          OrganizationInviteRow,
          | "id"
          | "division_id"
          | "email"
          | "phone_wa"
          | "role"
          | "token"
          | "status"
          | "expires_at"
          | "created_at"
        >;
        Update: Partial<OrganizationInviteRow>;
        Relationships: [];
      };
      scrims: {
        Row: ScrimRow;
        Insert: WithoutGenerated<
          ScrimRow,
          | "id"
          | "opponent_contact"
          | "format"
          | "status"
          | "server_region"
          | "room_info"
          | "notes"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<ScrimRow>;
        Relationships: [];
      };
      scrim_attendances: {
        Row: ScrimAttendanceRow;
        Insert: WithoutGenerated<
          ScrimAttendanceRow,
          "id" | "status" | "note" | "updated_at"
        >;
        Update: Partial<ScrimAttendanceRow>;
        Relationships: [];
      };
      scrim_results: {
        Row: ScrimResultRow;
        Insert: WithoutGenerated<
          ScrimResultRow,
          | "id"
          | "our_score"
          | "opponent_score"
          | "is_win"
          | "notes"
          | "performance_rating"
          | "recorded_at"
        >;
        Update: Partial<ScrimResultRow>;
        Relationships: [];
      };
      announcements: {
        Row: AnnouncementRow;
        Insert: WithoutGenerated<
          AnnouncementRow,
          | "id"
          | "division_id"
          | "is_pinned"
          | "send_wa_blast"
          | "published_at"
          | "created_at"
        >;
        Update: Partial<AnnouncementRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: WithoutGenerated<
          NotificationRow,
          | "id"
          | "organization_id"
          | "body"
          | "ref_id"
          | "ref_type"
          | "status"
          | "wa_number"
          | "wa_message"
          | "attempts"
          | "last_error"
          | "sent_at"
          | "read_at"
          | "created_at"
        >;
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      calendar_events: {
        Row: CalendarEventRow;
        Insert: WithoutGenerated<
          CalendarEventRow,
          | "id"
          | "division_id"
          | "description"
          | "event_type"
          | "ends_at"
          | "is_all_day"
          | "location"
          | "ref_id"
          | "ref_type"
          | "created_at"
        >;
        Update: Partial<CalendarEventRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_member_of: {
        Args: { org_id: string };
        Returns: boolean;
      };
      get_member_role: {
        Args: { org_id: string };
        Returns: MemberRole;
      };
      is_captain_or_above: {
        Args: { org_id: string };
        Returns: boolean;
      };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: undefined;
      };
      mark_all_notifications_read: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      org_tier: OrgTier;
      member_role: MemberRole;
      scrim_status: ScrimStatus;
      match_format: MatchFormat;
      attendance_status: AttendanceStatus;
      notification_status: NotificationStatus;
      notification_type: NotificationType;
      invite_status: InviteStatus;
      visibility: Visibility;
    };
    CompositeTypes: Record<string, never>;
  };
}
