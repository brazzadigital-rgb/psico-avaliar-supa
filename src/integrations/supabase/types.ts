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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointment_logs: {
        Row: {
          action: string
          appointment_id: string
          by_user_id: string | null
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          appointment_id: string
          by_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          appointment_id?: string
          by_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          canceled_reason: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          client_id: string | null
          code: string
          created_at: string
          end_time: string
          id: string
          internal_notes: string | null
          location_address: string | null
          modality: Database["public"]["Enums"]["appointment_modality"]
          online_meeting_link: string | null
          professional_id: string | null
          reason_for_visit: string | null
          reminder_24h_sent: boolean | null
          reminder_2h_sent: boolean | null
          scheduled_date: string
          scheduled_time: string
          service_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          timezone: string | null
          updated_at: string
          video_event_id: string | null
          video_link: string | null
          video_provider: string | null
        }
        Insert: {
          canceled_reason?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          client_id?: string | null
          code: string
          created_at?: string
          end_time: string
          id?: string
          internal_notes?: string | null
          location_address?: string | null
          modality: Database["public"]["Enums"]["appointment_modality"]
          online_meeting_link?: string | null
          professional_id?: string | null
          reason_for_visit?: string | null
          reminder_24h_sent?: boolean | null
          reminder_2h_sent?: boolean | null
          scheduled_date: string
          scheduled_time: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string | null
          updated_at?: string
          video_event_id?: string | null
          video_link?: string | null
          video_provider?: string | null
        }
        Update: {
          canceled_reason?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          client_id?: string | null
          code?: string
          created_at?: string
          end_time?: string
          id?: string
          internal_notes?: string | null
          location_address?: string | null
          modality?: Database["public"]["Enums"]["appointment_modality"]
          online_meeting_link?: string | null
          professional_id?: string | null
          reason_for_visit?: string | null
          reminder_24h_sent?: boolean | null
          reminder_2h_sent?: boolean | null
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string | null
          updated_at?: string
          video_event_id?: string | null
          video_link?: string | null
          video_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_logs: {
        Row: {
          action: string
          created_at: string
          email: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          email?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          email?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          professional_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          professional_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          professional_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          gallery_images: string[] | null
          id: string
          og_image_url: string | null
          published_at: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          gallery_images?: string[] | null
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          gallery_images?: string[] | null
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      briefing_approvals: {
        Row: {
          approver_email: string
          approver_name: string
          created_at: string
          id: string
          notes: string | null
          status: string
          token: string
        }
        Insert: {
          approver_email: string
          approver_name: string
          created_at?: string
          id?: string
          notes?: string | null
          status: string
          token: string
        }
        Update: {
          approver_email?: string
          approver_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          token?: string
        }
        Relationships: []
      }
      briefing_checklist_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      briefing_checklist_responses: {
        Row: {
          approval_id: string
          comment: string | null
          created_at: string
          decision: string
          id: string
          item_id: string
        }
        Insert: {
          approval_id: string
          comment?: string | null
          created_at?: string
          decision: string
          id?: string
          item_id: string
        }
        Update: {
          approval_id?: string
          comment?: string | null
          created_at?: string
          decision?: string
          id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefing_checklist_responses_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "briefing_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefing_checklist_responses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "briefing_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_content: {
        Row: {
          content: Json
          id: string
          is_active: boolean
          key: string
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          is_active?: boolean
          key: string
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          is_active?: boolean
          key?: string
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      briefing_link_access_logs: {
        Row: {
          accessed_at: string
          id: string
          ip_address: string | null
          link_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          link_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefing_link_access_logs_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "briefing_links"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_links: {
        Row: {
          access_count: number
          created_at: string
          created_by_user_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          last_accessed_at: string | null
          token: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          created_by_user_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          token: string
        }
        Update: {
          access_count?: number
          created_at?: string
          created_by_user_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          token?: string
        }
        Relationships: []
      }
      checkout_rate_limits: {
        Row: {
          attempts: number
          blocked_until: string | null
          first_attempt_at: string
          id: string
          ip_hash: string
          last_attempt_at: string
        }
        Insert: {
          attempts?: number
          blocked_until?: string | null
          first_attempt_at?: string
          id?: string
          ip_hash: string
          last_attempt_at?: string
        }
        Update: {
          attempts?: number
          blocked_until?: string | null
          first_attempt_at?: string
          id?: string
          ip_hash?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string
          full_name: string
          guardian_name: string | null
          id: string
          is_minor: boolean | null
          lgpd_consent: boolean | null
          lgpd_consent_at: string | null
          notes: string | null
          notification_email: boolean | null
          notification_whatsapp: boolean | null
          phone: string
          preferred_modality: string | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email: string
          full_name: string
          guardian_name?: string | null
          id?: string
          is_minor?: boolean | null
          lgpd_consent?: boolean | null
          lgpd_consent_at?: string | null
          notes?: string | null
          notification_email?: boolean | null
          notification_whatsapp?: boolean | null
          phone: string
          preferred_modality?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string
          full_name?: string
          guardian_name?: string | null
          id?: string
          is_minor?: boolean | null
          lgpd_consent?: boolean | null
          lgpd_consent_at?: string | null
          notes?: string | null
          notification_email?: boolean | null
          notification_whatsapp?: boolean | null
          phone?: string
          preferred_modality?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      date_overrides: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          is_available: boolean
          professional_id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          professional_id: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          professional_id?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "date_overrides_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          sent_at: string | null
          status: string
          subject: string
          template_key: string | null
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject: string
          template_key?: string | null
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string | null
          to_email?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          is_active: boolean | null
          key: string
          name: string
          subject: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean | null
          key: string
          name: string
          subject: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean | null
          key?: string
          name?: string
          subject?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      google_integrations: {
        Row: {
          access_token_encrypted: string | null
          calendar_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by_user_id: string | null
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email: string
          expires_at: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token_hash?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          file_path: string
          file_size: number | null
          filename: string
          id: string
          mime_type: string | null
          original_filename: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          mime_type?: string | null
          original_filename: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          mime_type?: string | null
          original_filename?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      notification_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          event_key: string
          id: string
          last_error: string | null
          payload_json: Json
          run_at: string
          status: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          event_key: string
          id?: string
          last_error?: string | null
          payload_json?: Json
          run_at: string
          status?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          event_key?: string
          id?: string
          last_error?: string | null
          payload_json?: Json
          run_at?: string
          status?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string
          toggles_json: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          toggles_json?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          toggles_json?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          category: string
          created_at: string
          delivered_at: string | null
          event_key: string
          id: string
          metadata_json: Json | null
          priority: string
          read_at: string | null
          recipient_user_id: string
          resource_id: string | null
          resource_type: string | null
          status: string
          title: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          category?: string
          created_at?: string
          delivered_at?: string | null
          event_key: string
          id?: string
          metadata_json?: Json | null
          priority?: string
          read_at?: string | null
          recipient_user_id: string
          resource_id?: string | null
          resource_type?: string | null
          status?: string
          title: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          category?: string
          created_at?: string
          delivered_at?: string | null
          event_key?: string
          id?: string
          metadata_json?: Json | null
          priority?: string
          read_at?: string | null
          recipient_user_id?: string
          resource_id?: string | null
          resource_type?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata_json: Json | null
          order_id: string
          payable_id: string | null
          payable_type: string
          quantity: number
          total_amount: number
          unit_amount: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata_json?: Json | null
          order_id: string
          payable_id?: string | null
          payable_type: string
          quantity?: number
          total_amount: number
          unit_amount: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata_json?: Json | null
          order_id?: string
          payable_id?: string | null
          payable_type?: string
          quantity?: number
          total_amount?: number
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          appointment_id: string | null
          balance_due: number | null
          checkout_token: string | null
          client_id: string | null
          code: string
          created_at: string
          currency: string
          deposit_amount: number | null
          discount: number | null
          expires_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_required: boolean | null
          payment_type: string | null
          provider_selected: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          balance_due?: number | null
          checkout_token?: string | null
          client_id?: string | null
          code: string
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          discount?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_required?: boolean | null
          payment_type?: string | null
          provider_selected?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          balance_due?: number | null
          checkout_token?: string | null
          client_id?: string | null
          code?: string
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          discount?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_required?: boolean | null
          payment_type?: string | null
          provider_selected?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      password_resets: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_provider_configs: {
        Row: {
          created_at: string
          credentials_encrypted_json: Json | null
          environment: string
          id: string
          is_active: boolean | null
          provider: string
          settings_json: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials_encrypted_json?: Json | null
          environment?: string
          id?: string
          is_active?: boolean | null
          provider: string
          settings_json?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials_encrypted_json?: Json | null
          environment?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          settings_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_id: string
          provider_refund_id: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_id: string
          provider_refund_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_id?: string
          provider_refund_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          boleto_barcode: string | null
          boleto_url: string | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          installments: number | null
          method: string | null
          order_id: string
          paid_at: string | null
          payment_url: string | null
          pix_copy_paste: string | null
          pix_qr_base64: string | null
          provider: string
          provider_payment_id: string | null
          raw_provider_response_json: Json | null
          refunded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          boleto_barcode?: string | null
          boleto_url?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          installments?: number | null
          method?: string | null
          order_id: string
          paid_at?: string | null
          payment_url?: string | null
          pix_copy_paste?: string | null
          pix_qr_base64?: string | null
          provider: string
          provider_payment_id?: string | null
          raw_provider_response_json?: Json | null
          refunded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          boleto_barcode?: string | null
          boleto_url?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          installments?: number | null
          method?: string | null
          order_id?: string
          paid_at?: string | null
          payment_url?: string | null
          pix_copy_paste?: string | null
          pix_qr_base64?: string | null
          provider?: string
          provider_payment_id?: string | null
          raw_provider_response_json?: Json | null
          refunded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          benefits: string[] | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_highlighted: boolean | null
          name: string
          price: number | null
          price_display: string | null
          updated_at: string
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_highlighted?: boolean | null
          name: string
          price?: number | null
          price_display?: string | null
          updated_at?: string
        }
        Update: {
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_highlighted?: boolean | null
          name?: string
          price?: number | null
          price_display?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      professional_services: {
        Row: {
          id: string
          professional_id: string
          service_id: string
        }
        Insert: {
          id?: string
          professional_id: string
          service_id: string
        }
        Update: {
          id?: string
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          modalities:
            | Database["public"]["Enums"]["appointment_modality"][]
            | null
          name: string
          phone: string | null
          photo_url: string | null
          registration_number: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          modalities?:
            | Database["public"]["Enums"]["appointment_modality"][]
            | null
          name: string
          phone?: string | null
          photo_url?: string | null
          registration_number?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          modalities?:
            | Database["public"]["Enums"]["appointment_modality"][]
            | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          registration_number?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_config: {
        Row: {
          id: string
          is_configured: boolean
          sender_name: string | null
          updated_at: string
          vapid_private_key_encrypted: string | null
          vapid_public_key: string | null
        }
        Insert: {
          id?: string
          is_configured?: boolean
          sender_name?: string | null
          updated_at?: string
          vapid_private_key_encrypted?: string | null
          vapid_public_key?: string | null
        }
        Update: {
          id?: string
          is_configured?: boolean
          sender_name?: string | null
          updated_at?: string
          vapid_private_key_encrypted?: string | null
          vapid_public_key?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_label: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_label?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_label?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          allow_installments: boolean | null
          created_at: string
          currency: string
          deposit_amount: number | null
          description: string | null
          display_order: number | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          max_installments: number | null
          modalities:
            | Database["public"]["Enums"]["appointment_modality"][]
            | null
          name: string
          payment_type: string | null
          price: number | null
          price_from_amount: number | null
          price_mode: string
          require_payment_to_confirm: boolean | null
          show_price_publicly: boolean | null
          updated_at: string
        }
        Insert: {
          allow_installments?: boolean | null
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          max_installments?: number | null
          modalities?:
            | Database["public"]["Enums"]["appointment_modality"][]
            | null
          name: string
          payment_type?: string | null
          price?: number | null
          price_from_amount?: number | null
          price_mode?: string
          require_payment_to_confirm?: boolean | null
          show_price_publicly?: boolean | null
          updated_at?: string
        }
        Update: {
          allow_installments?: boolean | null
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          max_installments?: number | null
          modalities?:
            | Database["public"]["Enums"]["appointment_modality"][]
            | null
          name?: string
          payment_type?: string | null
          price?: number | null
          price_from_amount?: number | null
          price_mode?: string
          require_payment_to_confirm?: boolean | null
          show_price_publicly?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      system_health_logs: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata_json: Json | null
          service: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata_json?: Json | null
          service: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata_json?: Json | null
          service?: string
          status?: string
        }
        Relationships: []
      }
      time_off_blocks: {
        Row: {
          created_at: string
          end_date: string
          id: string
          professional_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          professional_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          professional_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          effect: string
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effect: string
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          effect?: string
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload_json: Json
          processed_at: string | null
          provider: string
          provider_event_id: string | null
          signature_valid: boolean | null
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload_json: Json
          processed_at?: string | null
          provider: string
          provider_event_id?: string | null
          signature_valid?: boolean | null
          status?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload_json?: Json
          processed_at?: string | null
          provider?: string
          provider_event_id?: string | null
          signature_valid?: boolean | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_checkout_rate_limit: { Args: { _ip_hash: string }; Returns: Json }
      create_notification: {
        Args: {
          _action_url?: string
          _body?: string
          _category: string
          _event_key: string
          _metadata?: Json
          _priority?: string
          _recipient_user_id: string
          _resource_id?: string
          _resource_type?: string
          _title: string
        }
        Returns: string
      }
      generate_briefing_token: { Args: never; Returns: string }
      generate_checkout_token: { Args: never; Returns: string }
      get_checkin_appointment_info: {
        Args: { _code: string }
        Returns: {
          checked_in_at: string
          client_full_name: string
          code: string
          end_time: string
          id: string
          modality: Database["public"]["Enums"]["appointment_modality"]
          scheduled_date: string
          scheduled_time: string
          service_duration_minutes: number
          service_name: string
          status: Database["public"]["Enums"]["appointment_status"]
        }[]
      }
      get_checkout_order: {
        Args: { _ip_hash?: string; _token: string }
        Returns: Json
      }
      get_or_create_client_for_booking: {
        Args: {
          _birth_date?: string
          _email: string
          _full_name: string
          _guardian_name?: string
          _is_minor?: boolean
          _phone: string
        }
        Returns: string
      }
      get_unread_notification_count: {
        Args: { _user_id: string }
        Returns: number
      }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          category: string
          permission_key: string
          permission_name: string
          source: string
        }[]
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_briefing_link_access: {
        Args: { link_token: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_client: { Args: { _user_id: string }; Returns: boolean }
      link_user_to_client: {
        Args: {
          _email: string
          _full_name: string
          _phone: string
          _user_id: string
        }
        Returns: string
      }
      mark_notifications_read: {
        Args: { _notification_ids?: string[]; _user_id: string }
        Returns: number
      }
      submit_briefing_approval: {
        Args: {
          _approver_email: string
          _approver_name: string
          _notes: string
          _responses: Json
          _status: string
          _token: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "receptionist" | "professional" | "client"
      appointment_modality: "presencial" | "online"
      appointment_status:
        | "pending"
        | "confirmed"
        | "rescheduled"
        | "canceled"
        | "completed"
        | "pending_payment"
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
      app_role: ["admin", "receptionist", "professional", "client"],
      appointment_modality: ["presencial", "online"],
      appointment_status: [
        "pending",
        "confirmed",
        "rescheduled",
        "canceled",
        "completed",
        "pending_payment",
      ],
    },
  },
} as const
