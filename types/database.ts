export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achieved_at: string
          created_at: string
          description: string | null
          division_id: string | null
          id: string
          image_url: string | null
          organization_id: string
          placement: number | null
          title: string
          tournament_id: string | null
        }
        Insert: {
          achieved_at: string
          created_at?: string
          description?: string | null
          division_id?: string | null
          id?: string
          image_url?: string | null
          organization_id: string
          placement?: number | null
          title: string
          tournament_id?: string | null
        }
        Update: {
          achieved_at?: string
          created_at?: string
          description?: string | null
          division_id?: string | null
          id?: string
          image_url?: string | null
          organization_id?: string
          placement?: number | null
          title?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievements_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string
          division_id: string | null
          id: string
          is_pinned: boolean
          organization_id: string
          published_at: string | null
          send_wa_blast: boolean
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          division_id?: string | null
          id?: string
          is_pinned?: boolean
          organization_id: string
          published_at?: string | null
          send_wa_blast?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          division_id?: string | null
          id?: string
          is_pinned?: boolean
          organization_id?: string
          published_at?: string | null
          send_wa_blast?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          division_id: string | null
          ends_at: string | null
          event_type: string
          id: string
          is_all_day: boolean
          location: string | null
          organization_id: string
          ref_id: string | null
          ref_type: string | null
          starts_at: string
          title: string
          visibility: string
          calendar_id: string | null
          area: string | null
          platform: string | null
          status: string
          priority: string
          pic_user_id: string | null
          tags: string[]
          visual_needed: boolean
          content: Json | null
          color: string | null
          recurring_rule: Json | null
          recurring_parent_id: string | null
          is_recurring: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          division_id?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          organization_id: string
          ref_id?: string | null
          ref_type?: string | null
          starts_at: string
          title: string
          visibility?: string
          calendar_id?: string | null
          area?: string | null
          platform?: string | null
          status?: string
          priority?: string
          pic_user_id?: string | null
          tags?: string[]
          visual_needed?: boolean
          content?: Json | null
          color?: string | null
          recurring_rule?: Json | null
          recurring_parent_id?: string | null
          is_recurring?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          division_id?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          organization_id?: string
          ref_id?: string | null
          ref_type?: string | null
          starts_at?: string
          title?: string
          visibility?: string
          calendar_id?: string | null
          area?: string | null
          platform?: string | null
          status?: string
          priority?: string
          pic_user_id?: string | null
          tags?: string[]
          visual_needed?: boolean
          content?: Json | null
          color?: string | null
          recurring_rule?: Json | null
          recurring_parent_id?: string | null
          is_recurring?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          organization_id: string
          platform: Database["public"]["Enums"]["content_platform"]
          scheduled_at: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          organization_id: string
          platform: Database["public"]["Enums"]["content_platform"]
          scheduled_at: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          organization_id?: string
          platform?: Database["public"]["Enums"]["content_platform"]
          scheduled_at?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string
          description: string | null
          game: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          organization_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          game: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          organization_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          game?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "divisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          bucket_name: string
          created_at: string
          division_id: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          organization_id: string
          ref_id: string | null
          ref_type: string | null
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          division_id?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          organization_id: string
          ref_id?: string | null
          ref_type?: string | null
          storage_path: string
          uploaded_by: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          division_id?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          organization_id?: string
          ref_id?: string | null
          ref_type?: string | null
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finances: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          date: string
          description: string | null
          id: string
          organization_id: string
          type: Database["public"]["Enums"]["finance_type"]
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          id?: string
          organization_id: string
          type: Database["public"]["Enums"]["finance_type"]
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          organization_id?: string
          type?: Database["public"]["Enums"]["finance_type"]
        }
        Relationships: [
          {
            foreignKeyName: "finances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      login_rate_limits: {
        Row: {
          attempts: number
          identifier: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          identifier: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          identifier?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          event_type: string
          org_id: string
          user_id: string
          wa_enabled: boolean
        }
        Insert: {
          event_type: string
          org_id: string
          user_id: string
          wa_enabled?: boolean
        }
        Update: {
          event_type?: string
          org_id?: string
          user_id?: string
          wa_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          attempts: number
          body: string | null
          created_at: string
          id: string
          last_error: string | null
          organization_id: string | null
          read_at: string | null
          ref_id: string | null
          ref_type: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          wa_message: string | null
          wa_number: string | null
          retry_count: number | null
          claimed_at: string | null
        }
        Insert: {
          attempts?: number
          body?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          organization_id?: string | null
          read_at?: string | null
          ref_id?: string | null
          ref_type?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          wa_message?: string | null
          wa_number?: string | null
          retry_count?: number | null
          claimed_at?: string | null
        }
        Update: {
          attempts?: number
          body?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          organization_id?: string | null
          read_at?: string | null
          ref_id?: string | null
          ref_type?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
          wa_message?: string | null
          wa_number?: string | null
          retry_count?: number | null
          claimed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opponent_profiles: {
        Row: {
          created_at: string
          created_by: string
          data: Json
          id: string
          opponent_name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data?: Json
          id?: string
          opponent_name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: Json
          id?: string
          opponent_name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opponent_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          created_at: string
          division_id: string | null
          email: string | null
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          phone_wa: string | null
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["invite_status"]
          token: string
        }
        Insert: {
          created_at?: string
          division_id?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          phone_wa?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Update: {
          created_at?: string
          division_id?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          phone_wa?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          banner_url: string | null
          created_at: string
          custom_domain: string | null
          description: string | null
          game_focus: string[] | null
          id: string
          is_public: boolean
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          social_links: Json
          tier: Database["public"]["Enums"]["org_tier"]
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          game_focus?: string[] | null
          id?: string
          is_public?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          social_links?: Json
          tier?: Database["public"]["Enums"]["org_tier"]
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          game_focus?: string[] | null
          id?: string
          is_public?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          social_links?: Json
          tier?: Database["public"]["Enums"]["org_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      player_target_history: {
        Row: {
          id: string
          level: number
          recorded_at: string
          target_id: string
        }
        Insert: {
          id?: string
          level: number
          recorded_at?: string
          target_id: string
        }
        Update: {
          id?: string
          level?: number
          recorded_at?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_target_history_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "player_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      player_targets: {
        Row: {
          created_at: string
          created_by: string
          current_level: number
          id: string
          notes: string | null
          organization_id: string
          skill_name: string
          target_level: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_level?: number
          id?: string
          notes?: string | null
          organization_id: string
          skill_name: string
          target_level: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_level?: number
          id?: string
          notes?: string | null
          organization_id?: string
          skill_name?: string
          target_level?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_closed: boolean
          options: Json
          organization_id: string
          question: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_closed?: boolean
          options?: Json
          organization_id: string
          question: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_closed?: boolean
          options?: Json
          organization_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          full_name: string | null
          game_ids: Json
          id: string
          phone_wa: string | null
          social_links: Json
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          full_name?: string | null
          game_ids?: Json
          id: string
          phone_wa?: string | null
          social_links?: Json
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          full_name?: string | null
          game_ids?: Json
          id?: string
          phone_wa?: string | null
          social_links?: Json
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      scrim_attendances: {
        Row: {
          coach_notes: string | null
          id: string
          note: string | null
          rating: number | null
          scrim_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_notes?: string | null
          id?: string
          note?: string | null
          rating?: number | null
          scrim_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_notes?: string | null
          id?: string
          note?: string | null
          rating?: number | null
          scrim_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_attendances_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_game_results: {
        Row: {
          created_at: string
          game_number: number
          id: string
          image_url: string | null
          is_win: boolean
          notes: string | null
          scrim_id: string
        }
        Insert: {
          created_at?: string
          game_number: number
          id?: string
          image_url?: string | null
          is_win: boolean
          notes?: string | null
          scrim_id: string
        }
        Update: {
          created_at?: string
          game_number?: number
          id?: string
          image_url?: string | null
          is_win?: boolean
          notes?: string | null
          scrim_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_game_results_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_requests: {
        Row: {
          created_at: string
          created_by: string
          division_id: string
          format: Database["public"]["Enums"]["match_format"]
          from_org_id: string
          id: string
          message: string | null
          preferred_time: string | null
          responded_at: string | null
          responded_by: string | null
          status: Database["public"]["Enums"]["scrim_request_status"]
          to_org_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          division_id: string
          format?: Database["public"]["Enums"]["match_format"]
          from_org_id: string
          id?: string
          message?: string | null
          preferred_time?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["scrim_request_status"]
          to_org_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          division_id?: string
          format?: Database["public"]["Enums"]["match_format"]
          from_org_id?: string
          id?: string
          message?: string | null
          preferred_time?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["scrim_request_status"]
          to_org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_requests_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_requests_from_org_id_fkey"
            columns: ["from_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_requests_to_org_id_fkey"
            columns: ["to_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_draft_picks: {
        Row: {
          created_at: string
          game_number: number
          hero_name: string
          id: string
          player_id: string | null
          role: string
          scrim_id: string
          side: string
        }
        Insert: {
          created_at?: string
          game_number: number
          hero_name: string
          id?: string
          player_id?: string | null
          role: string
          scrim_id: string
          side: string
        }
        Update: {
          created_at?: string
          game_number?: number
          hero_name?: string
          id?: string
          player_id?: string | null
          role?: string
          scrim_id?: string
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_draft_picks_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_results: {
        Row: {
          coach_notes: string | null
          id: string
          is_win: boolean | null
          notes: string | null
          opponent_score: number
          our_score: number
          performance_rating: number | null
          recorded_at: string
          recorded_by: string
          result_image_path: string | null
          scrim_id: string
        }
        Insert: {
          coach_notes?: string | null
          id?: string
          is_win?: boolean | null
          notes?: string | null
          opponent_score?: number
          our_score?: number
          performance_rating?: number | null
          recorded_at?: string
          recorded_by: string
          result_image_path?: string | null
          scrim_id: string
        }
        Update: {
          coach_notes?: string | null
          id?: string
          is_win?: boolean | null
          notes?: string | null
          opponent_score?: number
          our_score?: number
          performance_rating?: number | null
          recorded_at?: string
          recorded_by?: string
          result_image_path?: string | null
          scrim_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_results_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: true
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
        ]
      }
      scrims: {
        Row: {
          created_at: string
          created_by: string
          day_reminder_sent_at: string | null
          division_id: string
          format: Database["public"]["Enums"]["match_format"]
          h24_reminder_sent_at: string | null
          h30_reminder_sent_at: string | null
          id: string
          notes: string | null
          opponent_contact: string | null
          opponent_name: string
          organization_id: string
          reminder_sent_at: string | null
          room_info: string | null
          scheduled_at: string
          server_region: string | null
          status: Database["public"]["Enums"]["scrim_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          day_reminder_sent_at?: string | null
          division_id: string
          format?: Database["public"]["Enums"]["match_format"]
          h24_reminder_sent_at?: string | null
          h30_reminder_sent_at?: string | null
          id?: string
          notes?: string | null
          opponent_contact?: string | null
          opponent_name: string
          organization_id: string
          reminder_sent_at?: string | null
          room_info?: string | null
          scheduled_at: string
          server_region?: string | null
          status?: Database["public"]["Enums"]["scrim_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          day_reminder_sent_at?: string | null
          division_id?: string
          format?: Database["public"]["Enums"]["match_format"]
          h24_reminder_sent_at?: string | null
          h30_reminder_sent_at?: string | null
          id?: string
          notes?: string | null
          opponent_contact?: string | null
          opponent_name?: string
          organization_id?: string
          reminder_sent_at?: string | null
          room_info?: string | null
          scheduled_at?: string
          server_region?: string | null
          status?: Database["public"]["Enums"]["scrim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrims_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_patches: {
        Row: {
          id: string
          organization_id: string
          patch_version: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          tier_descriptions: Record<string, string> | null
        }
        Insert: {
          id?: string
          organization_id: string
          patch_version: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          tier_descriptions?: Record<string, string> | null
        }
        Update: {
          id?: string
          organization_id?: string
          patch_version?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          tier_descriptions?: Record<string, string> | null
        }
        Relationships: []
      }
      meta_hero_ratings: {
        Row: {
          id: string
          patch_id: string
          hero_name: string
          tier: "SS" | "S" | "A" | "B" | "C" | "D"
          role_tag: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null
          hero_class: string | null
          is_ban_priority: boolean
          priority_to_learn: boolean
          notes: string | null
          counters: string[] | null
          synergies: string[] | null
          draft_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patch_id: string
          hero_name: string
          tier: "SS" | "S" | "A" | "B" | "C" | "D"
          role_tag?: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null
          hero_class?: string | null
          is_ban_priority?: boolean
          priority_to_learn?: boolean
          notes?: string | null
          counters?: string[] | null
          synergies?: string[] | null
          draft_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patch_id?: string
          hero_name?: string
          tier?: "SS" | "S" | "A" | "B" | "C" | "D"
          role_tag?: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null
          hero_class?: string | null
          is_ban_priority?: boolean
          priority_to_learn?: boolean
          notes?: string | null
          counters?: string[] | null
          synergies?: string[] | null
          draft_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          logo_url: string | null;
          status: "prospect" | "active" | "inactive" | "ended";
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          deal_value: number | null;
          currency: string;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          logo_url?: string | null;
          status?: "prospect" | "active" | "inactive" | "ended";
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          deal_value?: number | null;
          currency?: string;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          logo_url?: string | null;
          status?: "prospect" | "active" | "inactive" | "ended";
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          deal_value?: number | null;
          currency?: string;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sponsor_deliverables: {
        Row: {
          id: string;
          sponsor_id: string;
          title: string;
          description: string | null;
          category: "content" | "post" | "branding" | "event" | "other";
          status: "pending" | "in_progress" | "done" | "cancelled";
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sponsor_id: string;
          title: string;
          description?: string | null;
          category?: "content" | "post" | "branding" | "event" | "other";
          status?: "pending" | "in_progress" | "done" | "cancelled";
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sponsor_id?: string;
          title?: string;
          description?: string | null;
          category?: "content" | "post" | "branding" | "event" | "other";
          status?: "pending" | "in_progress" | "done" | "cancelled";
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sponsor_notes: {
        Row: {
          id: string;
          sponsor_id: string;
          content: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sponsor_id: string;
          content: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sponsor_id?: string;
          content?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      strategy_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          division_id: string
          id: string
          is_pinned: boolean
          organization_id: string
          tags: string[]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          division_id: string
          id?: string
          is_pinned?: boolean
          organization_id: string
          tags?: string[]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          division_id?: string
          id?: string
          is_pinned?: boolean
          organization_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "strategy_notes_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          availability: Database["public"]["Enums"]["member_availability"]
          division_id: string | null
          id: string
          is_active: boolean
          jersey_number: number | null
          joined_at: string
          main_role: string | null
          organization_id: string
          position: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          availability?: Database["public"]["Enums"]["member_availability"]
          division_id?: string | null
          id?: string
          is_active?: boolean
          jersey_number?: number | null
          joined_at?: string
          main_role?: string | null
          organization_id: string
          position?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          availability?: Database["public"]["Enums"]["member_availability"]
          division_id?: string | null
          id?: string
          is_active?: boolean
          jersey_number?: number | null
          joined_at?: string
          main_role?: string | null
          organization_id?: string
          position?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_results: {
        Row: {
          id: string
          notes: string | null
          placement: number | null
          prize_earned: string | null
          recorded_at: string
          recorded_by: string | null
          tournament_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          placement?: number | null
          prize_earned?: string | null
          recorded_at?: string
          recorded_by?: string | null
          tournament_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          placement?: number | null
          prize_earned?: string | null
          recorded_at?: string
          recorded_by?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_stages: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          notes: string | null
          scheduled_at: string
          stage_name: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          scheduled_at: string
          stage_name: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          scheduled_at?: string
          stage_name?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_stages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          created_by: string | null
          day_reminder_sent_at: string | null
          division_id: string
          end_date: string | null
          h1_reminder_sent_at: string | null
          h30_reminder_sent_at: string | null
          id: string
          is_registered: boolean
          link: string | null
          name: string
          notes: string | null
          organization_id: string
          organizer: string | null
          prize_pool: string | null
          registration_deadline: string | null
          registration_fee: string | null
          registration_url: string | null
          start_date: string
          start_time: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_reminder_sent_at?: string | null
          division_id: string
          end_date?: string | null
          h1_reminder_sent_at?: string | null
          h30_reminder_sent_at?: string | null
          id?: string
          is_registered?: boolean
          link?: string | null
          name: string
          notes?: string | null
          organization_id: string
          organizer?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: string | null
          registration_url?: string | null
          start_date: string
          start_time?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_reminder_sent_at?: string | null
          division_id?: string
          end_date?: string | null
          h1_reminder_sent_at?: string | null
          h30_reminder_sent_at?: string | null
          id?: string
          is_registered?: boolean
          link?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          organizer?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: string | null
          registration_url?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_comments: {
        Row: {
          id: string
          event_id: string
          user_id: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_relations: {
        Row: {
          id: string
          event_id: string
          rel_type: string
          rel_id: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          rel_type: string
          rel_id: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          rel_type?: string
          rel_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_relations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_audit_logs: {
        Row: {
          id: string
          organization_id: string
          calendar_id: string | null
          event_id: string | null
          actor_id: string | null
          action: string
          entity_type: string
          changes: Json
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          calendar_id?: string | null
          event_id?: string | null
          actor_id?: string | null
          action: string
          entity_type: string
          changes?: Json
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          calendar_id?: string | null
          event_id?: string | null
          actor_id?: string | null
          action?: string
          entity_type?: string
          changes?: Json
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_audit_logs_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendar_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_audit_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_configs: {
        Row: {
          id: string
          organization_id: string
          division_id: string | null
          created_by: string
          title: string
          description: string | null
          visibility: string
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          division_id?: string | null
          created_by: string
          title: string
          description?: string | null
          visibility?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          division_id?: string | null
          created_by?: string
          title?: string
          description?: string | null
          visibility?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_configs_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_member_permissions: {
        Row: {
          id: string
          organization_id: string
          calendar_id: string
          member_user_id: string
          can_view: boolean
          can_create_event: boolean
          can_edit_event: boolean
          can_delete_event: boolean
          can_manage_permissions: boolean
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          calendar_id: string
          member_user_id: string
          can_view?: boolean
          can_create_event?: boolean
          can_edit_event?: boolean
          can_delete_event?: boolean
          can_manage_permissions?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          calendar_id?: string
          member_user_id?: string
          can_view?: boolean
          can_create_event?: boolean
          can_edit_event?: boolean
          can_delete_event?: boolean
          can_manage_permissions?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_member_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_member_permissions_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendar_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_visibility_rules: {
        Row: {
          id: string
          organization_id: string
          visibility: string
          permissions: Json
          is_active: boolean
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          visibility: string
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          visibility?: string
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_visibility_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_visibility: {
        Row: {
          id: string
          organization_id: string
          event_id: string
          calendar_id: string | null
          visibility: string
          allowed_member_ids: string[]
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          event_id: string
          calendar_id?: string | null
          visibility: string
          allowed_member_ids?: string[]
          created_at?: string
          updated_at?: string
          created_by: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          event_id?: string
          calendar_id?: string | null
          visibility?: string
          allowed_member_ids?: string[]
          created_at?: string
          updated_at?: string
          created_by?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_visibility_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_visibility_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_visibility_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendar_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      enqueue_daily_digest_reminders: { Args: never; Returns: number }
      enqueue_h1_tournament_reminders: { Args: never; Returns: number }
      enqueue_h30_scrim_reminders: { Args: never; Returns: number }
      enqueue_h30_tournament_reminders: { Args: never; Returns: number }
      enqueue_scrim_h24_reminders: { Args: never; Returns: number }
      enqueue_scrim_reminders: { Args: never; Returns: number }
      get_member_role: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      is_captain_or_above: { Args: { org_id: string }; Returns: boolean }
      is_member_of: { Args: { org_id: string }; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: {
          attempts: number
          body: string | null
          created_at: string
          id: string
          last_error: string | null
          organization_id: string | null
          read_at: string | null
          ref_id: string | null
          ref_type: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          wa_message: string | null
          wa_number: string | null
        }
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      trigger_process_wa_queue: { Args: never; Returns: undefined }
    }
    Enums: {
      attendance_status: "confirmed" | "declined" | "tentative" | "pending"
      content_platform: "ig" | "tiktok" | "x"
      content_status: "draft" | "scheduled" | "approved" | "published"
      finance_type: "income" | "expense"
      invite_status: "pending" | "accepted" | "rejected" | "expired"
      match_format:
        | "bo1"
        | "bo3"
        | "bo5"
        | "scrimmage"
        | "bo2"
        | "bo7"
        | "4match"
      member_availability: "active" | "hiatus" | "unavailable"
      member_role: "owner" | "captain" | "member" | "coach" | "manager"
      notification_status: "pending" | "sent" | "failed" | "read"
      notification_type:
        | "scrim_invite"
        | "scrim_reminder"
        | "announcement"
        | "result"
        | "invite"
        | "system"
      org_tier: "pelajar" | "komunitas" | "pro"
      scrim_request_status: "pending" | "accepted" | "declined"
      scrim_status: "scheduled" | "ongoing" | "completed" | "cancelled"
      visibility: "public" | "division" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["confirmed", "declined", "tentative", "pending"],
      content_platform: ["ig", "tiktok", "x"],
      content_status: ["draft", "scheduled", "approved", "published"],
      finance_type: ["income", "expense"],
      invite_status: ["pending", "accepted", "rejected", "expired"],
      match_format: ["bo1", "bo3", "bo5", "scrimmage", "bo2", "bo7", "4match"],
      member_availability: ["active", "hiatus", "unavailable"],
      member_role: ["owner", "captain", "member", "coach", "manager"],
      notification_status: ["pending", "sent", "failed", "read"],
      notification_type: [
        "scrim_invite",
        "scrim_reminder",
        "announcement",
        "result",
        "invite",
        "system",
      ],
      org_tier: ["pelajar", "komunitas", "pro"],
      scrim_request_status: ["pending", "accepted", "declined"],
      scrim_status: ["scheduled", "ongoing", "completed", "cancelled"],
      visibility: ["public", "division", "private"],
    },
  },
} as const

export type MemberAvailability = Database["public"]["Enums"]["member_availability"];
export type MemberRole = Database["public"]["Enums"]["member_role"];

// Convenience row types
export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
export type ScrimStatus = Database["public"]["Enums"]["scrim_status"];
export type MatchFormat = Database["public"]["Enums"]["match_format"];
export type ContentStatus = Database["public"]["Enums"]["content_status"];

export type ContentCalendarRow = Database["public"]["Tables"]["content_calendar"]["Row"];
export type FinanceRow = Database["public"]["Tables"]["finances"]["Row"];
export type CalendarConfigRow = Database["public"]["Tables"]["calendar_configs"]["Row"];
export type CalendarMemberPermissionRow = Database["public"]["Tables"]["calendar_member_permissions"]["Row"];
export type CalendarAuditLogRow = Database["public"]["Tables"]["calendar_audit_logs"]["Row"];
export type EventVisibilityRow = Database["public"]["Tables"]["event_visibility"]["Row"];

