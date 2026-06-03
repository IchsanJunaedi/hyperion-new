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
      about_alumni: {
        Row: {
          id: string
          name: string
          role: string
          image_url: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role?: string
          image_url?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          image_url?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          achieved_at: string
          created_at: string
          description: string | null
          division_id: string | null
          id: string
          image_url: string | null
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
      announcement_reads: {
        Row: {
          announcement_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
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
          requires_ack: boolean
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
          requires_ack?: boolean
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
          requires_ack?: boolean
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
      calendar_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          calendar_id: string | null
          changes: Json
          created_at: string
          entity_type: string
          event_id: string | null
          id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          calendar_id?: string | null
          changes?: Json
          created_at?: string
          entity_type: string
          event_id?: string | null
          id?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          calendar_id?: string | null
          changes?: Json
          created_at?: string
          entity_type?: string
          event_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
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
          {
            foreignKeyName: "calendar_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_configs: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          division_id: string | null
          id: string
          is_active: boolean
          organization_id: string
          title: string
          updated_at: string
          updated_by: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          division_id?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          division_id?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_configs_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_rsvps: {
        Row: {
          event_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          calendar_id: string | null
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
        }
        Insert: {
          calendar_id?: string | null
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
        }
        Update: {
          calendar_id?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendar_configs"
            referencedColumns: ["id"]
          },
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
      calendar_member_permissions: {
        Row: {
          calendar_id: string
          can_create_event: boolean
          can_delete_event: boolean
          can_edit_event: boolean
          can_manage_permissions: boolean
          can_view: boolean
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          member_user_id: string
          organization_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          calendar_id: string
          can_create_event?: boolean
          can_delete_event?: boolean
          can_edit_event?: boolean
          can_manage_permissions?: boolean
          can_view?: boolean
          created_at?: string
          created_by: string
          deleted_at?: string | null
          id?: string
          member_user_id: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          calendar_id?: string
          can_create_event?: boolean
          can_delete_event?: boolean
          can_edit_event?: boolean
          can_manage_permissions?: boolean
          can_view?: boolean
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          member_user_id?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_member_permissions_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendar_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_member_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_visibility_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          permissions: Json
          updated_at: string
          updated_by: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          permissions?: Json
          updated_at?: string
          updated_by?: string | null
          visibility: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          permissions?: Json
          updated_at?: string
          updated_by?: string | null
          visibility?: string
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
          is_public: boolean
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
          is_public?: boolean
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
          is_public?: boolean
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
      divisions_public: {
        Row: {
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      event_visibility: {
        Row: {
          allowed_member_ids: string[]
          calendar_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          event_id: string
          id: string
          organization_id: string
          updated_at: string
          updated_by: string | null
          visibility: string
        }
        Insert: {
          allowed_member_ids?: string[]
          calendar_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          event_id: string
          id?: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
          visibility: string
        }
        Update: {
          allowed_member_ids?: string[]
          calendar_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          event_id?: string
          id?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_visibility_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendar_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_visibility_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_visibility_organization_id_fkey"
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
      gallery_entries: {
        Row: {
          created_at: string
          description: string
          division: string
          id: string
          logo_url: string | null
          position: string
          preview_images: string[]
          slug: string
          sort_order: number
          status: string
          title: string
          tournament_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          division: string
          id?: string
          logo_url?: string | null
          position: string
          preview_images?: string[]
          slug: string
          sort_order?: number
          status?: string
          title: string
          tournament_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          division?: string
          id?: string
          logo_url?: string | null
          position?: string
          preview_images?: string[]
          slug?: string
          sort_order?: number
          status?: string
          title?: string
          tournament_date?: string
          updated_at?: string
        }
        Relationships: []
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
      meta_hero_ratings: {
        Row: {
          counters: string[] | null
          created_at: string
          draft_notes: string | null
          hero_class: string | null
          hero_name: string
          id: string
          is_ban_priority: boolean
          notes: string | null
          patch_id: string
          priority_to_learn: boolean
          role_tag: string | null
          synergies: string[] | null
          tier: string
          updated_at: string
        }
        Insert: {
          counters?: string[] | null
          created_at?: string
          draft_notes?: string | null
          hero_class?: string | null
          hero_name: string
          id?: string
          is_ban_priority?: boolean
          notes?: string | null
          patch_id: string
          priority_to_learn?: boolean
          role_tag?: string | null
          synergies?: string[] | null
          tier: string
          updated_at?: string
        }
        Update: {
          counters?: string[] | null
          created_at?: string
          draft_notes?: string | null
          hero_class?: string | null
          hero_name?: string
          id?: string
          is_ban_priority?: boolean
          notes?: string | null
          patch_id?: string
          priority_to_learn?: boolean
          role_tag?: string | null
          synergies?: string[] | null
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_hero_ratings_patch_id_fkey"
            columns: ["patch_id"]
            isOneToOne: false
            referencedRelation: "meta_patches"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_patches: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          patch_version: string
          tier_descriptions: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          patch_version: string
          tier_descriptions?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          patch_version?: string
          tier_descriptions?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_patches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      open_trials: {
        Row: {
          created_at: string
          created_by: string | null
          division_id: string | null
          game: string
          id: string
          org_id: string
          positions: string[]
          public_token: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          division_id?: string | null
          game: string
          id?: string
          org_id: string
          positions?: string[]
          public_token?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          division_id?: string | null
          game?: string
          id?: string
          org_id?: string
          positions?: string[]
          public_token?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_trials_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_trials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number
          website_url: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          website_url?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          website_url?: string | null
        }
        Relationships: []
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
      player_contracts: {
        Row: {
          bonus_percentage: number
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          monthly_salary: number
          notes: string | null
          organization_id: string
          start_date: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_percentage?: number
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          monthly_salary?: number
          notes?: string | null
          organization_id: string
          start_date: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_percentage?: number
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          monthly_salary?: number
          notes?: string | null
          organization_id?: string
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      poll_availability_votes: {
        Row: {
          created_at: string
          id: string
          poll_id: string
          slot_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          poll_id: string
          slot_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          poll_id?: string
          slot_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_availability_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
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
          availability_slots: Json | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_closed: boolean
          options: Json
          organization_id: string
          question: string
          type: string
        }
        Insert: {
          availability_slots?: Json | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_closed?: boolean
          options?: Json
          organization_id: string
          question: string
          type?: string
        }
        Update: {
          availability_slots?: Json | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_closed?: boolean
          options?: Json
          organization_id?: string
          question?: string
          type?: string
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
          email: string | null
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
          email?: string | null
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
          email?: string | null
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
      salary_payments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          paid_by: string | null
          pay_period: string
          status: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          paid_by?: string | null
          pay_period: string
          status?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          paid_by?: string | null
          pay_period?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "player_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      scrim_draft_bans: {
        Row: {
          ban_order: number
          created_at: string
          game_number: number
          hero_name: string
          id: string
          scrim_id: string
          side: string
        }
        Insert: {
          ban_order: number
          created_at?: string
          game_number: number
          hero_name: string
          id?: string
          scrim_id: string
          side: string
        }
        Update: {
          ban_order?: number
          created_at?: string
          game_number?: number
          hero_name?: string
          id?: string
          scrim_id?: string
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_draft_bans_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
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
      scrim_review_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scrim_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scrim_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scrim_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_review_requests_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: true
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_vod_timestamps: {
        Row: {
          created_at: string
          created_by: string
          game_number: number
          id: string
          note: string
          scrim_id: string
          tagged_player_id: string | null
          timestamp_secs: number
        }
        Insert: {
          created_at?: string
          created_by: string
          game_number: number
          id?: string
          note: string
          scrim_id: string
          tagged_player_id?: string | null
          timestamp_secs: number
        }
        Update: {
          created_at?: string
          created_by?: string
          game_number?: number
          id?: string
          note?: string
          scrim_id?: string
          tagged_player_id?: string | null
          timestamp_secs?: number
        }
        Relationships: [
          {
            foreignKeyName: "scrim_vod_timestamps_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
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
          vod_link: string | null
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
          vod_link?: string | null
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
          vod_link?: string | null
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
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sponsor_deliverables: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          sponsor_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          sponsor_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          sponsor_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_deliverables_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          sponsor_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          sponsor_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_notes_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          currency: string
          deal_value: number | null
          end_date: string | null
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          organization_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deal_value?: number | null
          end_date?: string | null
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          organization_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deal_value?: number | null
          end_date?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_comments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "strategy_notes"
            referencedColumns: ["id"]
          },
        ]
      }
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
      testimonials: {
        Row: {
          author_name: string
          author_role: string
          avatar_url: string | null
          content: string
          id: string
          is_active: boolean
          sort_order: number
        }
        Insert: {
          author_name: string
          author_role: string
          avatar_url?: string | null
          content: string
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          author_name?: string
          author_role?: string
          avatar_url?: string | null
          content?: string
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      tournament_bonus_distributions: {
        Row: {
          bonus_amount: number
          bonus_percentage: number
          contract_id: string
          distributed_at: string
          id: string
          organization_id: string
          placement: number | null
          tournament_id: string
          tournament_name: string
          user_id: string
        }
        Insert: {
          bonus_amount: number
          bonus_percentage: number
          contract_id: string
          distributed_at?: string
          id?: string
          organization_id: string
          placement?: number | null
          tournament_id: string
          tournament_name: string
          user_id: string
        }
        Update: {
          bonus_amount?: number
          bonus_percentage?: number
          contract_id?: string
          distributed_at?: string
          id?: string
          organization_id?: string
          placement?: number | null
          tournament_id?: string
          tournament_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_bonus_distributions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "player_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_bonus_distributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_bonus_distributions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          created_at: string
          id: string
          is_win: boolean | null
          notes: string | null
          opponent_score: number | null
          our_score: number | null
          played_at: string | null
          round_label: string
          stage_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_win?: boolean | null
          notes?: string | null
          opponent_score?: number | null
          our_score?: number | null
          played_at?: string | null
          round_label: string
          stage_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_win?: boolean | null
          notes?: string | null
          opponent_score?: number | null
          our_score?: number | null
          played_at?: string | null
          round_label?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "tournament_stages"
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
          bracket_file_path: string | null
          bracket_link: string | null
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
          show_in_hero: boolean
          start_date: string
          start_time: string | null
          status: string
        }
        Insert: {
          bracket_file_path?: string | null
          bracket_link?: string | null
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
          show_in_hero?: boolean | null
          start_date: string
          start_time?: string | null
          status?: string
        }
        Update: {
          bracket_file_path?: string | null
          bracket_link?: string | null
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
          show_in_hero?: boolean | null
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
      trial_applicants: {
        Row: {
          age: number
          city: string | null
          competitive_exp: string | null
          created_at: string
          cv_url: string | null
          email: string
          game_id: string | null
          game_nickname: string | null
          hero_pool: string[] | null
          id: string
          ign: string
          is_free_agent: boolean
          main_game: string
          name: string
          notes: string | null
          phone: string
          rank: string
          role_applied: string
          screenshot_url: string | null
          secondary_game: string | null
          server: string
          social_media: string | null
          status: string
          trial_id: string
          win_rate: string | null
        }
        Insert: {
          age: number
          city?: string | null
          competitive_exp?: string | null
          created_at?: string
          cv_url?: string | null
          email: string
          game_id?: string | null
          game_nickname?: string | null
          hero_pool?: string[] | null
          id?: string
          ign: string
          is_free_agent?: boolean
          main_game: string
          name: string
          notes?: string | null
          phone: string
          rank: string
          role_applied: string
          screenshot_url?: string | null
          secondary_game?: string | null
          server: string
          social_media?: string | null
          status?: string
          trial_id: string
          win_rate?: string | null
        }
        Update: {
          age?: number
          city?: string | null
          competitive_exp?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string
          game_id?: string | null
          game_nickname?: string | null
          hero_pool?: string[] | null
          id?: string
          ign?: string
          is_free_agent?: boolean
          main_game?: string
          name?: string
          notes?: string | null
          phone?: string
          rank?: string
          role_applied?: string
          screenshot_url?: string | null
          secondary_game?: string | null
          server?: string
          social_media?: string | null
          status?: string
          trial_id?: string
          win_rate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_applicants_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "open_trials"
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
      get_audit_activity_by_day: {
        Args: { p_since: string }
        Returns: {
          cnt: number
          day_label: string
        }[]
      }
      get_hero_detail: {
        Args: { p_hero_name: string; p_org_id: string }
        Returns: Json
      }
      get_hero_statistics: {
        Args: { p_org_id: string }
        Returns: {
          enemy_ban_pct: number
          enemy_ban_total: number
          hero_name: string
          pb_pct: number
          pb_total: number
          pick_losses: number
          pick_pct: number
          pick_total: number
          pick_wins: number
          pick_wr: number
          team_ban_pct: number
          team_ban_total: number
        }[]
      }
      get_member_role: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      get_opening_balance: {
        Args: { p_before_date: string; p_org_id: string }
        Returns: number
      }
      get_scrim_win_loss: {
        Args: { p_org_id: string }
        Returns: {
          draws: number
          losses: number
          total: number
          wins: number
        }[]
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

// Convenience type aliases (manually maintained — not auto-generated)
export type ContentCalendarRow = Database["public"]["Tables"]["content_calendar"]["Row"];
export type ContentStatus = Database["public"]["Enums"]["content_status"];
export type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];
export type SponsorStatus = "pending" | "active" | "inactive";
export type MemberRole = Database["public"]["Enums"]["member_role"];
export type MemberAvailability = Database["public"]["Enums"]["member_availability"];
export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
export type MatchFormat = Database["public"]["Enums"]["match_format"];
export type ScrimStatus = Database["public"]["Enums"]["scrim_status"];
export type FinanceRow = Database["public"]["Tables"]["finances"]["Row"];
