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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      event_albums: {
        Row: {
          cover_media_id: string | null
          created_at: string
          created_by: string | null
          display_order: number
          event_id: string
          id: string
          is_custom: boolean
          name: string
          source_slug: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cover_media_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id: string
          id?: string
          is_custom?: boolean
          name: string
          source_slug?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cover_media_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id?: string
          id?: string
          is_custom?: boolean
          name?: string
          source_slug?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_albums_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "event_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_budgets: {
        Row: {
          created_at: string
          currency: string
          event_id: string
          modified_by: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          event_id: string
          modified_by?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          event_id?: string
          modified_by?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_budgets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
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
      event_expense_types: {
        Row: {
          created_at: string
          display_order: number
          enabled: boolean
          event_id: string
          icon_name: string | null
          id: string
          is_custom: boolean
          name: string
          source_slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          enabled?: boolean
          event_id: string
          icon_name?: string | null
          id?: string
          is_custom?: boolean
          name: string
          source_slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          enabled?: boolean
          event_id?: string
          icon_name?: string | null
          id?: string
          is_custom?: boolean
          name?: string
          source_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_expense_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          event_id: string
          expense_date: string | null
          expense_type_id: string
          id: string
          receipt_key: string | null
          sub_event_id: string | null
          title: string | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id: string
          expense_date?: string | null
          expense_type_id: string
          id?: string
          receipt_key?: string | null
          sub_event_id?: string | null
          title?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string
          expense_date?: string | null
          expense_type_id?: string
          id?: string
          receipt_key?: string | null
          sub_event_id?: string | null
          title?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "event_expense_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_sub_event_id_fkey"
            columns: ["sub_event_id"]
            isOneToOne: false
            referencedRelation: "event_sub_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guest_sub_events: {
        Row: {
          created_at: string
          event_id: string
          guest_id: string
          id: string
          sub_event_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_id: string
          id?: string
          sub_event_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_id?: string
          id?: string
          sub_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_guest_sub_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guest_sub_events_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "event_guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guest_sub_events_sub_event_id_fkey"
            columns: ["sub_event_id"]
            isOneToOne: false
            referencedRelation: "event_sub_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guest_tag_links: {
        Row: {
          created_at: string
          event_id: string
          guest_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_guest_tag_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guest_tag_links_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "event_guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guest_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "event_guest_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guest_tags: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          event_id: string
          id: string
          is_custom: boolean
          name: string
          source_slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id: string
          id?: string
          is_custom?: boolean
          name: string
          source_slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id?: string
          id?: string
          is_custom?: boolean
          name?: string
          source_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_guest_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guests: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          email: string | null
          event_id: string
          id: string
          invited: boolean
          name: string
          notes: string | null
          party_size: number
          phone: string | null
          rsvp_status_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          email?: string | null
          event_id: string
          id?: string
          invited?: boolean
          name: string
          notes?: string | null
          party_size?: number
          phone?: string | null
          rsvp_status_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          email?: string | null
          event_id?: string
          id?: string
          invited?: boolean
          name?: string
          notes?: string | null
          party_size?: number
          phone?: string | null
          rsvp_status_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media: {
        Row: {
          byte_size: number
          content_type: string | null
          created_at: string
          created_by: string | null
          duration_sec: number | null
          event_id: string
          height: number | null
          id: string
          kind: string
          name: string | null
          original_filename: string | null
          published: boolean
          storage_key: string
          sub_event_id: string | null
          taken_at: string | null
          thumbnail_key: string | null
          updated_at: string
          updated_by: string | null
          width: number | null
        }
        Insert: {
          byte_size?: number
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          duration_sec?: number | null
          event_id: string
          height?: number | null
          id?: string
          kind: string
          name?: string | null
          original_filename?: string | null
          published?: boolean
          storage_key: string
          sub_event_id?: string | null
          taken_at?: string | null
          thumbnail_key?: string | null
          updated_at?: string
          updated_by?: string | null
          width?: number | null
        }
        Update: {
          byte_size?: number
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          duration_sec?: number | null
          event_id?: string
          height?: number | null
          id?: string
          kind?: string
          name?: string | null
          original_filename?: string | null
          published?: boolean
          storage_key?: string
          sub_event_id?: string | null
          taken_at?: string | null
          thumbnail_key?: string | null
          updated_at?: string
          updated_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_sub_event_id_fkey"
            columns: ["sub_event_id"]
            isOneToOne: false
            referencedRelation: "event_sub_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media_albums: {
        Row: {
          album_id: string
          created_at: string
          event_id: string
          id: string
          media_id: string
        }
        Insert: {
          album_id: string
          created_at?: string
          event_id: string
          id?: string
          media_id: string
        }
        Update: {
          album_id?: string
          created_at?: string
          event_id?: string
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_media_albums_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "event_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_albums_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "event_media"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media_tag_links: {
        Row: {
          created_at: string
          event_id: string
          id: string
          media_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          media_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          media_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_media_tag_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_tag_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "event_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "event_media_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media_tags: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          event_id: string
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id: string
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id?: string
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_media_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      event_task_assignees: {
        Row: {
          assigned_by: string | null
          created_at: string
          event_id: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_task_assignees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "event_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tasks: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          due_date: string | null
          event_id: string
          id: string
          priority_id: string
          status_id: string
          sub_event_id: string | null
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          due_date?: string | null
          event_id: string
          id?: string
          priority_id: string
          status_id: string
          sub_event_id?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          due_date?: string | null
          event_id?: string
          id?: string
          priority_id?: string
          status_id?: string
          sub_event_id?: string | null
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
          {
            foreignKeyName: "event_tasks_sub_event_id_fkey"
            columns: ["sub_event_id"]
            isOneToOne: false
            referencedRelation: "event_sub_events"
            referencedColumns: ["id"]
          },
        ]
      }
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
    }
    Views: {
      event_album_counts: {
        Row: {
          album_id: string | null
          event_id: string | null
          media_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_media_albums_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "event_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_budget_summary: {
        Row: {
          currency: string | null
          event_id: string | null
          remaining: number | null
          spent: number | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_budgets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_expense_breakdown: {
        Row: {
          event_id: string | null
          expense_type_id: string | null
          icon_name: string | null
          item_count: number | null
          name: string | null
          spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "event_expense_types"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guest_stats: {
        Row: {
          attending: number | null
          attending_headcount: number | null
          declined: number | null
          event_id: string | null
          maybe: number | null
          pending: number | null
          total: number | null
          zero_assigned: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media_storage: {
        Row: {
          event_id: string | null
          photo_count: number | null
          used_bytes: number | null
          video_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sub_event_guest_counts: {
        Row: {
          event_id: string | null
          guest_count: number | null
          sub_event_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_guest_sub_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guest_sub_events_sub_event_id_fkey"
            columns: ["sub_event_id"]
            isOneToOne: false
            referencedRelation: "event_sub_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_task_progress: {
        Row: {
          done: number | null
          event_id: string | null
          percent: number | null
          total: number | null
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
    }
    Functions: {
      bulk_set_task_status: {
        Args: { p_status_slug: string; p_task_ids: string[] }
        Returns: number
      }
      create_event_with_details: {
        Args: {
          p_event_type_id: string
          p_guest_capacity: number
          p_metadata: Json
          p_name: string
          p_primary_date: string
          p_primary_venue: string
          p_sub_events: Json
          p_user_id: string
        }
        Returns: Json
      }
      event_task_counts: {
        Args: { p_event_id: string }
        Returns: {
          done: number
          overdue: number
          todo: number
          total: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
        Row: { id: string; event_type_id: string; title: string; description: string | null; display_order: number; enabled: boolean; default_priority_slug: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; event_type_id: string; title: string; description?: string | null; display_order?: number; enabled?: boolean; default_priority_slug?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; event_type_id?: string; title?: string; description?: string | null; display_order?: number; enabled?: boolean; default_priority_slug?: string | null; created_at?: string; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "event_checklists_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklists_default_priority_slug_fkey"
            columns: ["default_priority_slug"]
            isOneToOne: false
            referencedRelation: "task_priorities"
            referencedColumns: ["slug"]
          },
        ]
      }
      task_priorities: {
        Row: { id: string; slug: string; name: string; description: string | null; icon_name: string | null; display_order: number; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; description?: string | null; icon_name?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; slug?: string; name?: string; description?: string | null; icon_name?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      task_statuses: {
        Row: { id: string; slug: string; name: string; description: string | null; icon_name: string | null; category: string; display_order: number; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; description?: string | null; icon_name?: string | null; category: string; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; slug?: string; name?: string; description?: string | null; icon_name?: string | null; category?: string; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      expense_types: {
        Row: { id: string; slug: string; name: string; description: string | null; icon_name: string | null; display_order: number; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; description?: string | null; icon_name?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; slug?: string; name?: string; description?: string | null; icon_name?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      rsvp_statuses: {
        Row: { id: string; slug: string; name: string; description: string | null; icon_name: string | null; category: string; display_order: number; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; description?: string | null; icon_name?: string | null; category: string; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; slug?: string; name?: string; description?: string | null; icon_name?: string | null; category?: string; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      guest_tags: {
        Row: { id: string; slug: string; name: string; description: string | null; display_order: number; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; description?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; slug?: string; name?: string; description?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      album_presets: {
        Row: { id: string; slug: string; name: string; description: string | null; display_order: number; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; description?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; slug?: string; name?: string; description?: string | null; display_order?: number; enabled?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
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
    Enums: {},
  },
  config: {
    Enums: {},
  },
} as const
