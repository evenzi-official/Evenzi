// Generated Supabase types for the Evenzi data model.
// SOURCE OF TRUTH for table shapes is docs/data-model/DATA-MODEL.md.
//
// Regenerate (includes BOTH schemas — the default only emits `public`):
//   npx supabase gen types typescript --project-id smjkbmkxweevqpvygabe --schema public,config > lib/supabase/database.types.ts
//
// NOTE: the `config` schema block below was hand-added so config.* tables are typed today.
// After running the command above it will be emitted automatically — safe to overwrite this file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      events: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          event_details: Json
          event_type_id: string
          guest_capacity: number | null
          id: string
          name: string
          primary_date: string | null
          primary_venue: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          event_details?: Json
          event_type_id: string
          guest_capacity?: number | null
          id?: string
          name: string
          primary_date?: string | null
          primary_venue?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          event_details?: Json
          event_type_id?: string
          guest_capacity?: number | null
          id?: string
          name?: string
          primary_date?: string | null
          primary_venue?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_sub_events: {
        Row: {
          created_at: string
          custom_name: string | null
          display_order: number
          end_time: string | null
          event_date: string | null
          event_id: string
          event_sub_type_id: string | null
          guest_count: number | null
          id: string
          start_time: string | null
          status: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          display_order?: number
          end_time?: string | null
          event_date?: string | null
          event_id: string
          event_sub_type_id?: string | null
          guest_count?: number | null
          id?: string
          start_time?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          display_order?: number
          end_time?: string | null
          event_date?: string | null
          event_id?: string
          event_sub_type_id?: string | null
          guest_count?: number | null
          id?: string
          start_time?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sub_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_collaborators: {
        Row: {
          accepted_at: string | null
          created_at: string
          event_id: string
          id: string
          invited_at: string
          invited_email: string | null
          invited_phone: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          invited_at?: string
          invited_email?: string | null
          invited_phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          invited_at?: string
          invited_email?: string | null
          invited_phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_collaborators_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tasks: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          event_id: string
          id: string
          is_done: boolean
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_id: string
          id?: string
          is_done?: boolean
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_id?: string
          id?: string
          is_done?: boolean
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          auth_provider: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          location: string | null
          onboarding_completed: boolean
          phone: string | null
          role_slug: string | null
          updated_at: string
        }
        Insert: {
          auth_provider?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          location?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          role_slug?: string | null
          updated_at?: string
        }
        Update: {
          auth_provider?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          role_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          email_alerts: boolean
          push_notifications: boolean
          sms_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_alerts?: boolean
          push_notifications?: boolean
          sms_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_alerts?: boolean
          push_notifications?: boolean
          sms_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
  // --- hand-added: config schema (reference/catalog tables). Emitted automatically once you
  //     regenerate with `--schema public,config`. ---
  config: {
    Tables: {
      user_types: {
        Row: { id: string; slug: string; name: string; description: string | null; display_order: number; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; description?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; slug?: string; name?: string; description?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      event_types: {
        Row: { id: string; slug: string; name: string; description: string | null; icon_name: string | null; image_url: string | null; field_schema: Json; features: Json; display_order: number; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; description?: string | null; icon_name?: string | null; image_url?: string | null; field_schema?: Json; features?: Json; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; slug?: string; name?: string; description?: string | null; icon_name?: string | null; image_url?: string | null; field_schema?: Json; features?: Json; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      event_sub_types: {
        Row: { id: string; event_type_id: string; slug: string; name: string; icon_name: string | null; display_order: number; is_default: boolean; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; event_type_id: string; slug: string; name: string; icon_name?: string | null; display_order?: number; is_default?: boolean; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; event_type_id?: string; slug?: string; name?: string; icon_name?: string | null; display_order?: number; is_default?: boolean; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "event_sub_types_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklists: {
        Row: { id: string; event_type_id: string; title: string; description: string | null; display_order: number; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; event_type_id: string; title: string; description?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; event_type_id?: string; title?: string; description?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "event_checklists_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
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
