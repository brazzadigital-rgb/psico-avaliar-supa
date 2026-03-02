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
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["appointment_status"] | null
          notes: string | null
          old_status: Database["public"]["Enums"]["appointment_status"] | null
        }
        Insert: {
          action: string
          appointment_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["appointment_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["appointment_status"] | null
        }
        Update: {
          action?: string
          appointment_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["appointment_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["appointment_status"] | null
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
          reminder_24h_sent: boolean
          reminder_2h_sent: boolean
          scheduled_date: string
          scheduled_time: string
          service_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          timezone: string
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
          modality?: Database["public"]["Enums"]["appointment_modality"]
          online_meeting_link?: string | null
          professional_id?: string | null
          reason_for_visit?: string | null
          reminder_24h_sent?: boolean
          reminder_2h_sent?: boolean
          scheduled_date: string
          scheduled_time: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string
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
          reminder_24h_sent?: boolean
          reminder_2h_sent?: boolean
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string
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
          created_at: string
          event: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
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
          is_active: boolean
          professional_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          professional_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
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
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
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
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
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
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
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
          approved_at: string
          briefing_link_id: string
          client_email: string | null
          client_name: string
          id: string
          ip_address: string | null
          signature_data: string | null
          user_agent: string | null
        }
        Insert: {
          approved_at?: string
          briefing_link_id: string
          client_email?: string | null
          client_name: string
          id?: string
          ip_address?: string | null
          signature_data?: string | null
          user_agent?: string | null
        }
        Update: {
          approved_at?: string
          briefing_link_id?: string
          client_email?: string | null
          client_name?: string
          id?: string
          ip_address?: string | null
          signature_data?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefing_approvals_briefing_link_id_fkey"
            columns: ["briefing_link_id"]
            isOneToOne: false
            referencedRelation: "briefing_links"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_checklist_items: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          label: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
        }
        Relationships: []
      }
      briefing_checklist_responses: {
        Row: {
          approval_id: string
          checklist_item_id: string
          id: string
          is_checked: boolean
        }
        Insert: {
          approval_id: string
          checklist_item_id: string
          id?: string
          is_checked?: boolean
        }
        Update: {
          approval_id?: string
          checklist_item_id?: string
          id?: string
          is_checked?: boolean
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
            foreignKeyName: "briefing_checklist_responses_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "briefing_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_content: {
        Row: {
          content: string
          display_order: number
          id: string
          is_active: boolean
          section_key: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          display_order?: number
          id?: string
          is_active?: boolean
          section_key: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          display_order?: number
          id?: string
          is_active?: boolean
          section_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      briefing_link_access_logs: {
        Row: {
          accessed_at: string
          briefing_link_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          briefing_link_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          briefing_link_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefing_link_access_logs_briefing_link_id_fkey"
            columns: ["briefing_link_id"]
            isOneToOne: false
            referencedRelation: "briefing_links"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_links: {
        Row: {
          client_email: string | null
          client_name: string
          created_at: string
          created_by: string | null
          current_accesses: number
          expires_at: string
          id: string
          is_active: boolean
          max_accesses: number
          token: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          created_at?: string
          created_by?: string | null
          current_accesses?: number
          expires_at: string
          id?: string
          is_active?: boolean
          max_accesses?: number
          token?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          current_accesses?: number
          expires_at?: string
          id?: string
          is_active?: boolean
          max_accesses?: number
          token?: string
        }
        Relationships: []
      }
      checkout_rate_limits: {
        Row: {
          attempts: number
          first_attempt_at: string
          id: string
          ip_hash: string
          last_attempt_at: string
        }
        Insert: {
          attempts?: number
          first_attempt_at?: string
          id?: string
          ip_hash: string
          last_attempt_at?: string
        }
        Update: {
          attempts?: number
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
          is_minor: boolean
          lgpd_consent: boolean
          lgpd_consent_at: string | null
          notes: string | null
          notification_email: boolean
          notification_whatsapp: boolean
          phone: string
          preferred_modality:
            | Database["public"]["Enums"]["appointment_modality"]
            | null
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
          is_minor?: boolean
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          notes?: string | null
          notification_email?: boolean
          notification_whatsapp?: boolean
          phone: string
          preferred_modality?:
            | Database["public"]["Enums"]["appointment_modality"]
            | null
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
          is_minor?: boolean
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          notes?: string | null
          notification_email?: boolean
          notification_whatsapp?: boolean
          phone?: string
          preferred_modality?:
            | Database["public"]["Enums"]["appointment_modality"]
            | null
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
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
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
          end_time: string | null
          id: string
          is_blocked: boolean
          override_date: string
          professional_id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_blocked?: boolean
          override_date: string
          professional_id: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_blocked?: boolean
          override_date?: string
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
          error_message: string | null
          id: string
          status: string
          subject: string
          template: string | null
          to_email: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          subject: string
          template?: string | null
          to_email: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          subject?: string
          template?: string | null
          to_email?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          html_body: string
          id: string
          is_active: boolean
          name: string
          slug: string
          subject: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          created_at?: string
          html_body: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          subject: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          created_at?: string
          html_body?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          subject?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      google_integrations: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string
          id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      notification_jobs: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          job_type: string
          scheduled_for: string
          status: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          job_type: string
          scheduled_for: string
          status?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          job_type?: string
          scheduled_for?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_jobs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          categories: Json
          created_at: string
          email_enabled: boolean
          id: string
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string
          plan_id: string | null
          quantity: number
          service_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id: string
          plan_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          plan_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          appointment_id: string | null
          checkout_token: string | null
          client_id: string | null
          code: string
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          checkout_token?: string | null
          client_id?: string | null
          code: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          checkout_token?: string | null
          client_id?: string | null
          code?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          status?: string
          total_amount?: number
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
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      payment_provider_configs: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          is_sandbox: boolean
          provider: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_sandbox?: boolean
          provider: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_sandbox?: boolean
          provider?: string
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
          created_at: string
          currency: string
          id: string
          installments: number
          metadata: Json | null
          method: string | null
          order_id: string
          paid_at: string | null
          provider: string
          provider_payment_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          installments?: number
          metadata?: Json | null
          method?: string | null
          order_id: string
          paid_at?: string | null
          provider: string
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          installments?: number
          metadata?: Json | null
          method?: string | null
          order_id?: string
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string | null
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
          permission_key: string
          permission_name: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          permission_key: string
          permission_name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          permission_key?: string
          permission_name?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean
          name: string
          price: number
          sessions_included: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          sessions_included?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sessions_included?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      professional_services: {
        Row: {
          created_at: string
          id: string
          professional_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_id: string
          service_id: string
        }
        Update: {
          created_at?: string
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
          is_active: boolean
          modalities: Database["public"]["Enums"]["appointment_modality"][]
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
          is_active?: boolean
          modalities?: Database["public"]["Enums"]["appointment_modality"][]
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
          is_active?: boolean
          modalities?: Database["public"]["Enums"]["appointment_modality"][]
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
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_config: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          vapid_email: string | null
          vapid_private_key: string | null
          vapid_public_key: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          vapid_email?: string | null
          vapid_private_key?: string | null
          vapid_public_key?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          vapid_email?: string | null
          vapid_private_key?: string | null
          vapid_public_key?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
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
          allow_installments: boolean
          created_at: string
          currency: string
          deposit_amount: number | null
          description: string | null
          display_order: number
          duration_minutes: number
          id: string
          is_active: boolean
          max_installments: number
          modalities: Database["public"]["Enums"]["appointment_modality"][]
          name: string
          payment_type: string
          price: number | null
          price_from_amount: number | null
          price_mode: string
          require_payment_to_confirm: boolean
          show_price_publicly: boolean
          updated_at: string
        }
        Insert: {
          allow_installments?: boolean
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          max_installments?: number
          modalities?: Database["public"]["Enums"]["appointment_modality"][]
          name: string
          payment_type?: string
          price?: number | null
          price_from_amount?: number | null
          price_mode?: string
          require_payment_to_confirm?: boolean
          show_price_publicly?: boolean
          updated_at?: string
        }
        Update: {
          allow_installments?: boolean
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          max_installments?: number
          modalities?: Database["public"]["Enums"]["appointment_modality"][]
          name?: string
          payment_type?: string
          price?: number | null
          price_from_amount?: number | null
          price_mode?: string
          require_payment_to_confirm?: boolean
          show_price_publicly?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
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
      system_health_logs: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          service: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          service: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          service?: string
          status?: string
        }
        Relationships: []
      }
      time_off_blocks: {
        Row: {
          created_at: string
          end_datetime: string
          id: string
          professional_id: string
          reason: string | null
          start_datetime: string
        }
        Insert: {
          created_at?: string
          end_datetime: string
          id?: string
          professional_id: string
          reason?: string | null
          start_datetime: string
        }
        Update: {
          created_at?: string
          end_datetime?: string
          id?: string
          professional_id?: string
          reason?: string | null
          start_datetime?: string
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
          granted: boolean
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
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
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_checkout_rate_limit: {
        Args: {
          _ip_hash: string
          _max_attempts?: number
          _window_minutes?: number
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          _body: string
          _category?: string
          _link?: string
          _recipient_id: string
          _title: string
        }
        Returns: string
      }
      generate_briefing_token: { Args: never; Returns: string }
      generate_checkout_token: { Args: never; Returns: string }
      get_checkin_appointment_info: {
        Args: { _code: string }
        Returns: {
          appointment_id: string
          checked_in_at: string
          client_name: string
          modality: Database["public"]["Enums"]["appointment_modality"]
          professional_name: string
          scheduled_date: string
          scheduled_time: string
          service_name: string
          status: Database["public"]["Enums"]["appointment_status"]
        }[]
      }
      get_checkout_order: {
        Args: { _token: string }
        Returns: {
          client_email: string
          client_name: string
          client_phone: string
          currency: string
          items: Json
          order_code: string
          order_id: string
          order_status: string
          total_amount: number
        }[]
      }
      get_or_create_client_for_booking: {
        Args: {
          _birth_date?: string
          _email: string
          _guardian?: string
          _is_minor?: boolean
          _name: string
          _phone: string
        }
        Returns: string
      }
      get_professional_id_for_user: {
        Args: { _user_id: string }
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
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
        Args: { _link_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_client: { Args: { _user_id: string }; Returns: boolean }
      mark_notifications_read: {
        Args: { _ids?: string[]; _user_id: string }
        Returns: undefined
      }
      submit_briefing_approval: {
        Args: {
          _client_email: string
          _client_name: string
          _ip: string
          _link_id: string
          _responses: Json
          _signature: string
          _user_agent: string
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
      ],
    },
  },
} as const
