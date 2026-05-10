/**
 * Supabase auto-generated database types.
 *
 * This is a placeholder. After Step 2 (database setup) regenerate with:
 *   npm run db:types
 *
 * which runs:
 *   supabase gen types typescript --project-id <project-id> --schema public > types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
