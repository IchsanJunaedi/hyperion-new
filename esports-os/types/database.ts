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
