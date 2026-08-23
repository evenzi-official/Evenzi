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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
      event_general_settings: {
        Row: {
          created_at: string
          discoverable: boolean
          event_id: string
          show_on_dashboard: boolean
          tagline: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          discoverable?: boolean
          event_id: string
          show_on_dashboard?: boolean
          tagline?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          discoverable?: boolean
          event_id?: string
          show_on_dashboard?: boolean
          tagline?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_general_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_general_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guest_settings: {
        Row: {
          allow_plus_ones: boolean
          collect_dietary_notes: boolean
          created_at: string
          default_guest_message: string | null
          event_id: string
          max_plus_ones_per_invite: number
          rsvp_deadline: string | null
          rsvp_enabled: boolean
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          allow_plus_ones?: boolean
          collect_dietary_notes?: boolean
          created_at?: string
          default_guest_message?: string | null
          event_id: string
          max_plus_ones_per_invite?: number
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          allow_plus_ones?: boolean
          collect_dietary_notes?: boolean
          created_at?: string
          default_guest_message?: string | null
          event_id?: string
          max_plus_ones_per_invite?: number
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_guest_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_guest_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guest_sub_events: {
        Row: {
          created_at: string
          dietary_notes: string | null
          event_id: string
          guest_id: string
          id: string
          plus_one_count: number | null
          responded_at: string | null
          response_status: string | null
          sub_event_id: string
        }
        Insert: {
          created_at?: string
          dietary_notes?: string | null
          event_id: string
          guest_id: string
          id?: string
          plus_one_count?: number | null
          responded_at?: string | null
          response_status?: string | null
          sub_event_id: string
        }
        Update: {
          created_at?: string
          dietary_notes?: string | null
          event_id?: string
          guest_id?: string
          id?: string
          plus_one_count?: number | null
          responded_at?: string | null
          response_status?: string | null
          sub_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_guest_sub_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invitation_cards: {
        Row: {
          card_upload_key: string | null
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          is_custom: boolean
          is_default: boolean
          photo_bg_key: string | null
          render_status: string
          rendered_card_key: string | null
          rendered_pdf_key: string | null
          share_enabled: boolean
          share_token: string
          slot_couple: string | null
          slot_date: string | null
          slot_eyebrow: string | null
          slot_invite: string | null
          slot_message: string | null
          slot_sizes: Json
          slot_time: string | null
          slot_venue: string | null
          sub_event_id: string | null
          template_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          card_upload_key?: string | null
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          is_custom?: boolean
          is_default?: boolean
          photo_bg_key?: string | null
          render_status?: string
          rendered_card_key?: string | null
          rendered_pdf_key?: string | null
          share_enabled?: boolean
          share_token?: string
          slot_couple?: string | null
          slot_date?: string | null
          slot_eyebrow?: string | null
          slot_invite?: string | null
          slot_message?: string | null
          slot_sizes?: Json
          slot_time?: string | null
          slot_venue?: string | null
          sub_event_id?: string | null
          template_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          card_upload_key?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          is_custom?: boolean
          is_default?: boolean
          photo_bg_key?: string | null
          render_status?: string
          rendered_card_key?: string | null
          rendered_pdf_key?: string | null
          share_enabled?: boolean
          share_token?: string
          slot_couple?: string | null
          slot_date?: string | null
          slot_eyebrow?: string | null
          slot_invite?: string | null
          slot_message?: string | null
          slot_sizes?: Json
          slot_time?: string | null
          slot_venue?: string | null
          sub_event_id?: string | null
          template_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invitation_cards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_invitation_cards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invitation_cards_sub_event_id_fkey"
            columns: ["sub_event_id"]
            isOneToOne: false
            referencedRelation: "event_sub_events"
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_media_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_qa_items: {
        Row: {
          answer: string
          created_at: string
          created_by: string | null
          display_order: number
          event_id: string
          id: string
          is_visible: boolean
          question: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          answer: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id: string
          id?: string
          is_visible?: boolean
          question: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id?: string
          id?: string
          is_visible?: boolean
          question?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_qa_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_qa_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_stays: {
        Row: {
          address: string | null
          booking_url: string | null
          created_at: string
          created_by: string | null
          display_order: number
          distance_text: string | null
          event_id: string
          id: string
          map_link: string | null
          name: string
          note: string | null
          phone: string | null
          price_band: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          booking_url?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          distance_text?: string | null
          event_id: string
          id?: string
          map_link?: string | null
          name: string
          note?: string | null
          phone?: string | null
          price_band?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          booking_url?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          distance_text?: string | null
          event_id?: string
          id?: string
          map_link?: string | null
          name?: string
          note?: string | null
          phone?: string | null
          price_band?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_stays_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_stays_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_story_blocks: {
        Row: {
          block_type: string
          body: string | null
          created_at: string
          created_by: string | null
          display_order: number
          event_id: string
          heading: string | null
          id: string
          is_visible: boolean
          photo_key: string | null
          twocol: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          block_type: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id: string
          heading?: string | null
          id?: string
          is_visible?: boolean
          photo_key?: string | null
          twocol?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          block_type?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id?: string
          heading?: string | null
          id?: string
          is_visible?: boolean
          photo_key?: string | null
          twocol?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_story_blocks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_story_blocks_event_id_fkey"
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
          map_link: string | null
          show_on_website: boolean
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
          map_link?: string | null
          show_on_website?: boolean
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
          map_link?: string | null
          show_on_website?: boolean
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
      event_travel_points: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          distance_text: string | null
          event_id: string
          id: string
          kind: string
          map_link: string | null
          name: string
          note: string | null
          travel_time_text: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          distance_text?: string | null
          event_id: string
          id?: string
          kind: string
          map_link?: string | null
          name: string
          note?: string | null
          travel_time_text?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          distance_text?: string | null
          event_id?: string
          id?: string
          kind?: string
          map_link?: string | null
          name?: string
          note?: string | null
          travel_time_text?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_travel_points_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_travel_points_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_website_design: {
        Row: {
          body_font_id: string | null
          cover_image_key: string | null
          created_at: string
          event_id: string
          heading_font_id: string | null
          og_image_key: string | null
          palette_id: string | null
          template_id: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          body_font_id?: string | null
          cover_image_key?: string | null
          created_at?: string
          event_id: string
          heading_font_id?: string | null
          og_image_key?: string | null
          palette_id?: string | null
          template_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          body_font_id?: string | null
          cover_image_key?: string | null
          created_at?: string
          event_id?: string
          heading_font_id?: string | null
          og_image_key?: string | null
          palette_id?: string | null
          template_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_website_design_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_website_design_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_website_pages: {
        Row: {
          created_at: string
          custom_title: string | null
          display_order: number
          event_id: string
          id: string
          is_visible: boolean
          page_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_title?: string | null
          display_order?: number
          event_id: string
          id?: string
          is_visible?: boolean
          page_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_title?: string | null
          display_order?: number
          event_id?: string
          id?: string
          is_visible?: boolean
          page_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_website_pages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_website_pages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_website_password_sessions: {
        Row: {
          created_at: string
          event_id: string
          token: string
        }
        Insert: {
          created_at?: string
          event_id: string
          token?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_website_password_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_website_password_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_website_sections: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          display_order: number
          event_id: string
          id: string
          is_visible: boolean
          page_id: string
          section_type_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          display_order?: number
          event_id: string
          id?: string
          is_visible?: boolean
          page_id: string
          section_type_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          display_order?: number
          event_id?: string
          id?: string
          is_visible?: boolean
          page_id?: string
          section_type_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_website_sections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_website_sections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_website_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "event_website_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      event_website_settings: {
        Row: {
          announcement_banner_enabled: boolean
          announcement_banner_text: string | null
          created_at: string
          event_id: string
          search_indexing_enabled: boolean
          site_offline: boolean
          updated_at: string
          updated_by: string | null
          user_id: string
          website_password_enabled: boolean
          website_password_hash: string | null
        }
        Insert: {
          announcement_banner_enabled?: boolean
          announcement_banner_text?: string | null
          created_at?: string
          event_id: string
          search_indexing_enabled?: boolean
          site_offline?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id: string
          website_password_enabled?: boolean
          website_password_hash?: string | null
        }
        Update: {
          announcement_banner_enabled?: boolean
          announcement_banner_text?: string | null
          created_at?: string
          event_id?: string
          search_indexing_enabled?: boolean
          site_offline?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          website_password_enabled?: boolean
          website_password_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_website_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_website_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_wedding_party_members: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          event_id: string
          id: string
          is_visible: boolean
          name: string
          photo_key: string | null
          relation: string | null
          side: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id: string
          id?: string
          is_visible?: boolean
          name: string
          photo_key?: string | null
          relation?: string | null
          side: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id?: string
          id?: string
          is_visible?: boolean
          name?: string
          photo_key?: string | null
          relation?: string | null
          side?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_wedding_party_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_wedding_party_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          map_link: string | null
          name: string
          plan_id: string
          primary_date: string | null
          primary_venue: string | null
          slug: string | null
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
          map_link?: string | null
          name: string
          plan_id?: string
          primary_date?: string | null
          primary_venue?: string | null
          slug?: string | null
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
          map_link?: string | null
          name?: string
          plan_id?: string
          primary_date?: string | null
          primary_venue?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      faq_article_feedback: {
        Row: {
          article_id: string
          created_at: string
          helpful: boolean
          id: string
          user_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          helpful: boolean
          id?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          helpful?: boolean
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      guest_lookup_attempts: {
        Row: {
          attempted_at: string
          event_id: string
          id: number
          ip_hash: string
        }
        Insert: {
          attempted_at?: string
          event_id: string
          id?: never
          ip_hash: string
        }
        Update: {
          attempted_at?: string
          event_id?: string
          id?: never
          ip_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_lookup_attempts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "guest_lookup_attempts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_tokens: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string | null
          guest_id: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at?: string | null
          guest_id: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string | null
          guest_id?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "guest_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      help_queries: {
        Row: {
          audience: string
          created_at: string
          escalated: boolean
          id: number
          query: string
          ref: string
          resolved: boolean
          result_count: number
          top_score: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          audience: string
          created_at?: string
          escalated?: boolean
          id?: never
          query: string
          ref?: string
          resolved?: boolean
          result_count: number
          top_score?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          audience?: string
          created_at?: string
          escalated?: boolean
          id?: never
          query?: string
          ref?: string
          resolved?: boolean
          result_count?: number
          top_score?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          event_id: string
          id: string
          link_path: string | null
          read_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          event_id: string
          id?: string
          link_path?: string | null
          read_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          event_id?: string
          id?: string
          link_path?: string | null
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      push_dispatch_log: {
        Row: {
          dispatched_at: string
          notification_id: string
        }
        Insert: {
          dispatched_at?: string
          notification_id: string
        }
        Update: {
          dispatched_at?: string
          notification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_dispatch_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: true
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          context: Json
          created_at: string
          email: string
          id: string
          message: string
          page_url: string | null
          reference: string
          replied_at: string | null
          status: string
          topic_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          email: string
          id?: string
          message: string
          page_url?: string | null
          /** Filled by trg_support_tickets_reference when omitted. */
          reference?: string
          replied_at?: string | null
          status?: string
          topic_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          email?: string
          id?: string
          message?: string
          page_url?: string | null
          reference?: string
          replied_at?: string | null
          status?: string
          topic_slug?: string | null
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
      event_general_settings_view: {
        Row: {
          created_at: string | null
          discoverable: boolean | null
          event_date: string | null
          event_details: Json | null
          event_id: string | null
          event_name: string | null
          show_on_dashboard: boolean | null
          tagline: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_general_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_general_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guest_settings_view: {
        Row: {
          allow_plus_ones: boolean | null
          collect_dietary_notes: boolean | null
          created_at: string | null
          default_guest_message: string | null
          effective_max_plus_ones: number | null
          event_id: string | null
          max_plus_ones_per_invite: number | null
          rsvp_deadline: string | null
          rsvp_enabled: boolean | null
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          allow_plus_ones?: boolean | null
          collect_dietary_notes?: boolean | null
          created_at?: string | null
          default_guest_message?: string | null
          effective_max_plus_ones?: never
          event_id?: string | null
          max_plus_ones_per_invite?: number | null
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          allow_plus_ones?: boolean | null
          collect_dietary_notes?: boolean | null
          created_at?: string | null
          default_guest_message?: string | null
          effective_max_plus_ones?: never
          event_id?: string | null
          max_plus_ones_per_invite?: number | null
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_guest_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_guest_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_hub_summary: {
        Row: {
          budget_percent: number | null
          budget_spent: number | null
          budget_total: number | null
          default_card_share_token: string | null
          event_id: string | null
          event_name: string | null
          guest_total: number | null
          primary_date: string | null
          primary_venue: string | null
          sub_event_count: number | null
          task_done: number | null
          task_percent: number | null
          task_total: number | null
        }
        Relationships: []
      }
      event_invitation_card_summary: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string | null
          is_custom: boolean | null
          is_default: boolean | null
          is_uploaded_card: boolean | null
          render_status: string | null
          share_enabled: boolean | null
          share_token: string | null
          sub_event_id: string | null
          sub_event_label: string | null
          template_layout: string | null
          template_name: string | null
          template_style_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invitation_cards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_invitation_cards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invitation_cards_sub_event_id_fkey"
            columns: ["sub_event_id"]
            isOneToOne: false
            referencedRelation: "event_sub_events"
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
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
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_website_settings_view: {
        Row: {
          announcement_banner_enabled: boolean | null
          announcement_banner_text: string | null
          created_at: string | null
          event_id: string | null
          search_indexing_enabled: boolean | null
          site_offline: boolean | null
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
          website_days_remaining: string | null
          website_expired: boolean | null
          website_expires_at: string | null
          website_password_enabled: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "event_website_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_website_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_website_summary: {
        Row: {
          event_id: string | null
          pages: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "event_website_pages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_website_pages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_card_guest_view: {
        Row: {
          default_photo_key: string | null
          event_id: string | null
          id: string | null
          layout: string | null
          render_status: string | null
          rendered_card_key: string | null
          share_enabled: boolean | null
          share_token: string | null
          slot_couple: string | null
          slot_date: string | null
          slot_eyebrow: string | null
          slot_invite: string | null
          slot_message: string | null
          slot_time: string | null
          slot_venue: string | null
          style_id: string | null
          sub_event_id: string | null
          template_id: string | null
          template_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invitation_cards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hub_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_invitation_cards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invitation_cards_sub_event_id_fkey"
            columns: ["sub_event_id"]
            isOneToOne: false
            referencedRelation: "event_sub_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _notify_event_recipients: {
        Args: {
          p_actor_id: string
          p_body: string
          p_event_id: string
          p_link_path: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      _seed_event_settings: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: undefined
      }
      _website_page_content: {
        Args: { p_event_id: string; p_tier: string }
        Returns: Json
      }
      accept_event_invite: { Args: { p_token: string }; Returns: string }
      bulk_set_task_status: {
        Args: { p_status_slug: string; p_task_ids: string[] }
        Returns: number
      }
      can_read_event: {
        Args: { p_capability?: string; p_event_id: string }
        Returns: boolean
      }
      can_write_event: {
        Args: { p_capability: string; p_event_id: string }
        Returns: boolean
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
      create_guest_token: {
        Args: {
          p_event_id: string
          p_expires_at?: string
          p_guest_id: string
          p_token: string
        }
        Returns: string
      }
      decline_event_invite: { Args: { p_token: string }; Returns: string }
      event_task_counts: {
        Args: { p_event_id: string }
        Returns: {
          done: number
          overdue: number
          todo: number
          total: number
        }[]
      }
      gen_random_bytes: { Args: { n: number }; Returns: string }
      generate_event_slug: {
        Args: { p_date: string; p_name: string }
        Returns: string
      }
      get_guest_website_payload: {
        Args: { p_session_token: string }
        Returns: Json
      }
      get_pending_invite: {
        Args: { p_token: string }
        Returns: {
          event_id: string
          event_name: string
          id: string
          invited_email: string
          role: string
          status: string
        }[]
      }
      get_public_website_payload: { Args: { p_slug: string }; Returns: Json }
      get_push_delivery_targets: {
        Args: { p_user_id: string }
        Returns: {
          auth_key: string
          endpoint: string
          p256dh: string
        }[]
      }
      hash_website_password: { Args: { p_password: string }; Returns: string }
      is_website_gate_open: { Args: { p_event_id: string }; Returns: boolean }
      is_website_password_verified: {
        Args: { p_slug: string; p_token: string }
        Returns: boolean
      }
      list_my_pending_invites: {
        Args: never
        Returns: {
          event_id: string
          event_name: string
          id: string
          invited_at: string
          owner_display_name: string
          role: string
        }[]
      }
      mark_collab_invite_notifications_read: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: undefined
      }
      notify_recipients: {
        Args: {
          p_actor_id: string
          p_body: string
          p_event_id: string
          p_link_path: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      notify_user_by_email: {
        Args: {
          p_actor_id: string
          p_body: string
          p_email: string
          p_event_id: string
          p_title: string
        }
        Returns: undefined
      }
      resolve_guest_by_lookup: {
        Args: { p_name: string; p_phone: string; p_slug: string }
        Returns: string
      }
      resolve_guest_session: { Args: { p_token: string }; Returns: Json }
      submit_rsvp: {
        Args: {
          p_dietary_notes?: string
          p_plus_one_count?: number
          p_response_status: string
          p_sub_event_id: string
          p_token: string
        }
        Returns: undefined
      }
      verify_website_password: {
        Args: { p_password: string; p_slug: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
