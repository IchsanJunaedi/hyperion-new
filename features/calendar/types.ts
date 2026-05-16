import type { Database } from "@/types/database";

export type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];
export type CalendarEventComment = Database["public"]["Tables"]["calendar_event_comments"]["Row"];
export type CalendarEventRelation = Database["public"]["Tables"]["calendar_event_relations"]["Row"];

export interface RecurringRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  byday?: string[]; // ["MO", "WE", "FR"] for weekly
  count?: number;
  ends_at?: string; // ISO date
}

export interface TipTapContent {
  type: string;
  content?: TipTapContent[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

export interface EventDetailWithRelations extends CalendarEvent {
  pic?: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  comments?: CalendarEventComment[];
  relations?: CalendarEventRelation[];
}

export type EventStatus = "draft" | "confirmed" | "ongoing" | "completed" | "cancelled";
export type EventPriority = "low" | "medium" | "high" | "urgent";
export type EventType = "scrim" | "tournament" | "practice" | "meeting" | "other";
