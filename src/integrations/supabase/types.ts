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
      _sync_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author_name: string | null
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          published_at: string | null
          show_on_homepage: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          show_on_homepage?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          show_on_homepage?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blogs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      chatbot_qa: {
        Row: {
          answer: string
          created_at: string
          id: string
          product_id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer?: string
          created_at?: string
          id?: string
          product_id: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          product_id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          id: string
          order_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          order_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          order_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          coupon_scope: string
          created_at: string
          customer_email: string | null
          discount_type: string
          discount_value: number
          expiry_date: string
          id: string
          is_active: boolean
          max_discount_amount: number | null
          max_uses_per_customer: number
          min_cart_value: number | null
          product_id: string | null
          product_scope: string
          total_quantity: number
          updated_at: string
          variation_id: string | null
        }
        Insert: {
          code: string
          coupon_scope?: string
          created_at?: string
          customer_email?: string | null
          discount_type?: string
          discount_value?: number
          expiry_date: string
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses_per_customer?: number
          min_cart_value?: number | null
          product_id?: string | null
          product_scope?: string
          total_quantity?: number
          updated_at?: string
          variation_id?: string | null
        }
        Update: {
          code?: string
          coupon_scope?: string
          created_at?: string
          customer_email?: string | null
          discount_type?: string
          discount_value?: number
          expiry_date?: string
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses_per_customer?: number
          min_cart_value?: number | null
          product_id?: string | null
          product_scope?: string
          total_quantity?: number
          updated_at?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_assignments: {
        Row: {
          assigned_at: string
          credential_id: string
          id: string
          order_id: string
          user_id: string
          validity_days: number | null
        }
        Insert: {
          assigned_at?: string
          credential_id: string
          id?: string
          order_id: string
          user_id: string
          validity_days?: number | null
        }
        Update: {
          assigned_at?: string
          credential_id?: string
          id?: string
          order_id?: string
          user_id?: string
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credential_assignments_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "family_sharing_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credential_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_variant_links: {
        Row: {
          created_at: string
          credential_id: string
          id: string
          priority: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          id?: string
          priority?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          id?: string
          priority?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_variant_links_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "family_sharing_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credential_variant_links_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_logins: {
        Row: {
          id: string
          logged_in_at: string
          user_id: string
        }
        Insert: {
          id?: string
          logged_in_at?: string
          user_id: string
        }
        Update: {
          id?: string
          logged_in_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string
          created_at: string
          display_name: string
          fields: Json
          id: string
          template_key: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          display_name: string
          fields?: Json
          id?: string
          template_key: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_name?: string
          fields?: Json
          id?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      family_sharing_credentials: {
        Row: {
          assigned_count: number
          created_at: string
          expiry_date: string | null
          family_product_id: string
          id: string
          index_number: number
          max_limit: number
          password: string
          remarks: string | null
          twofa_link: string | null
          updated_at: string
          username: string
        }
        Insert: {
          assigned_count?: number
          created_at?: string
          expiry_date?: string | null
          family_product_id: string
          id?: string
          index_number?: number
          max_limit?: number
          password: string
          remarks?: string | null
          twofa_link?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          assigned_count?: number
          created_at?: string
          expiry_date?: string | null
          family_product_id?: string
          id?: string
          index_number?: number
          max_limit?: number
          password?: string
          remarks?: string | null
          twofa_link?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_sharing_credentials_family_product_id_fkey"
            columns: ["family_product_id"]
            isOneToOne: false
            referencedRelation: "family_sharing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      family_sharing_product_variants: {
        Row: {
          created_at: string
          family_product_id: string
          id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          family_product_id: string
          id?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          family_product_id?: string
          id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_sharing_product_variants_family_product_id_fkey"
            columns: ["family_product_id"]
            isOneToOne: false
            referencedRelation: "family_sharing_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_sharing_product_variants_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      family_sharing_products: {
        Row: {
          created_at: string
          id: string
          login_link: string | null
          order_note_template: string | null
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_link?: string | null
          order_note_template?: string | null
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_link?: string | null
          order_note_template?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_sharing_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      flash_sale_labels: {
        Row: {
          created_at: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          column_name: string
          created_at: string
          id: string
          label: string
          sort_order: number
          url: string
        }
        Insert: {
          column_name: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          url: string
        }
        Update: {
          column_name?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      input_fields: {
        Row: {
          checkbox_mode: string | null
          created_at: string
          field_type: string
          id: string
          is_required: boolean
          label: string
          name: string
          options: Json | null
          placeholder: string | null
          question: string | null
          updated_at: string
        }
        Insert: {
          checkbox_mode?: string | null
          created_at?: string
          field_type: string
          id?: string
          is_required?: boolean
          label: string
          name: string
          options?: Json | null
          placeholder?: string | null
          question?: string | null
          updated_at?: string
        }
        Update: {
          checkbox_mode?: string | null
          created_at?: string
          field_type?: string
          id?: string
          is_required?: boolean
          label?: string
          name?: string
          options?: Json | null
          placeholder?: string | null
          question?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      license_key_views: {
        Row: {
          id: string
          license_key_id: string
          remarks: string | null
          viewed_at: string
          viewed_by: string
          viewed_by_email: string | null
        }
        Insert: {
          id?: string
          license_key_id: string
          remarks?: string | null
          viewed_at?: string
          viewed_by: string
          viewed_by_email?: string | null
        }
        Update: {
          id?: string
          license_key_id?: string
          remarks?: string | null
          viewed_at?: string
          viewed_by?: string
          viewed_by_email?: string | null
        }
        Relationships: []
      }
      license_keys: {
        Row: {
          created_at: string
          id: string
          key_value: string
          product_id: string
          status: string
          updated_at: string
          variation_id: string | null
          view_count: number
          view_limit: number
        }
        Insert: {
          created_at?: string
          id?: string
          key_value: string
          product_id: string
          status?: string
          updated_at?: string
          variation_id?: string | null
          view_count?: number
          view_limit?: number
        }
        Update: {
          created_at?: string
          id?: string
          key_value?: string
          product_id?: string
          status?: string
          updated_at?: string
          variation_id?: string | null
          view_count?: number
          view_limit?: number
        }
        Relationships: []
      }
      media: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
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
      nav_menu_items: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          description: string
          heading: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          heading?: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          heading?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_audit_log: {
        Row: {
          action: string
          changed_by: string
          created_at: string
          details: string | null
          id: string
          order_id: string
        }
        Insert: {
          action: string
          changed_by: string
          created_at?: string
          details?: string | null
          id?: string
          order_id: string
        }
        Update: {
          action?: string
          changed_by?: string
          created_at?: string
          details?: string | null
          id?: string
          order_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          input_field_responses: Json | null
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          variation_id: string | null
          variation_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          input_field_responses?: Json | null
          order_id: string
          price: number
          product_id?: string | null
          quantity?: number
          variation_id?: string | null
          variation_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          input_field_responses?: Json | null
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          variation_id?: string | null
          variation_name?: string | null
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
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          created_at: string
          id: string
          is_admin_only: boolean
          note: string
          order_id: string
          sent_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_only?: boolean
          note: string
          order_id: string
          sent_by: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_only?: boolean
          note?: string
          order_id?: string
          sent_by?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          order_number: string
          payment_method: string
          payment_pidx: string | null
          payment_status: string
          refund_amount: number | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_number?: string
          payment_method?: string
          payment_pidx?: string | null
          payment_status?: string
          refund_amount?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_number?: string
          payment_method?: string
          payment_pidx?: string | null
          payment_status?: string
          refund_amount?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_input_fields: {
        Row: {
          created_at: string
          id: string
          input_field_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          input_field_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          input_field_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_input_fields_input_field_id_fkey"
            columns: ["input_field_id"]
            isOneToOne: false
            referencedRelation: "input_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_input_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_variations: {
        Row: {
          created_at: string
          expiry_days: number | null
          has_special_input_fields: boolean
          id: string
          is_active: boolean
          name: string
          original_price: number | null
          price: number
          product_id: string
          sort_order: number
          stock_status: string
          variation_info: string | null
        }
        Insert: {
          created_at?: string
          expiry_days?: number | null
          has_special_input_fields?: boolean
          id?: string
          is_active?: boolean
          name: string
          original_price?: number | null
          price: number
          product_id: string
          sort_order?: number
          stock_status?: string
          variation_info?: string | null
        }
        Update: {
          created_at?: string
          expiry_days?: number | null
          has_special_input_fields?: boolean
          id?: string
          is_active?: boolean
          name?: string
          original_price?: number | null
          price?: number
          product_id?: string
          sort_order?: number
          stock_status?: string
          variation_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration: string | null
          features: Json | null
          flash_sale_label: string | null
          id: string
          image_url: string | null
          is_bestseller: boolean | null
          is_featured: boolean | null
          is_flash_sale: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          order_mode: string
          original_price: number | null
          price: number
          rating: number | null
          region: string | null
          single_product_tag: string | null
          slug: string
          stock_status: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          features?: Json | null
          flash_sale_label?: string | null
          id?: string
          image_url?: string | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_flash_sale?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_mode?: string
          original_price?: number | null
          price: number
          rating?: number | null
          region?: string | null
          single_product_tag?: string | null
          slug: string
          stock_status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          features?: Json | null
          flash_sale_label?: string | null
          id?: string
          image_url?: string | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_flash_sale?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_mode?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          region?: string | null
          single_product_tag?: string | null
          slug?: string
          stock_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_suspended: boolean
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_suspended?: boolean
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_suspended?: boolean
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          instruction_template: string
          product_id: string
          remarks: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          instruction_template?: string
          product_id: string
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          instruction_template?: string
          product_id?: string
          remarks?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      single_product_tags: {
        Row: {
          created_at: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      task_activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: string | null
          id: string
          task_id: string | null
          template_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          task_id?: string | null
          template_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          task_id?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          assigned_to: string
          created_at: string
          created_by: string
          description: string | null
          due_time: string
          end_date: string | null
          id: string
          is_paused: boolean
          last_generated_for: string | null
          recurrence_interval: number
          recurrence_type: Database["public"]["Enums"]["task_recurrence_type"]
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          created_at?: string
          created_by: string
          description?: string | null
          due_time?: string
          end_date?: string | null
          id?: string
          is_paused?: boolean
          last_generated_for?: string | null
          recurrence_interval?: number
          recurrence_type: Database["public"]["Enums"]["task_recurrence_type"]
          start_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_time?: string
          end_date?: string | null
          id?: string
          is_paused?: boolean
          last_generated_for?: string | null
          recurrence_interval?: number
          recurrence_type?: Database["public"]["Enums"]["task_recurrence_type"]
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string
          completed_at: string | null
          completion_alert_sent_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string
          id: string
          overdue_alert_sent_at: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          completed_at?: string | null
          completion_alert_sent_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at: string
          id?: string
          overdue_alert_sent_at?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          completed_at?: string | null
          completion_alert_sent_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string
          id?: string
          overdue_alert_sent_at?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variation_input_fields: {
        Row: {
          created_at: string
          id: string
          input_field_id: string
          sort_order: number
          variation_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_field_id: string
          sort_order?: number
          variation_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_field_id?: string
          sort_order?: number
          variation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variation_input_fields_input_field_id_fkey"
            columns: ["input_field_id"]
            isOneToOne: false
            referencedRelation: "input_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variation_input_fields_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_list: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_assignments: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "customer"
      order_status:
        | "pending"
        | "processing"
        | "on_hold"
        | "completed"
        | "cancelled"
        | "refunded"
      task_recurrence_type: "daily" | "weekly" | "monthly" | "every_x_days"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "skipped"
        | "overdue"
      ticket_status: "open" | "closed"
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
      app_role: ["admin", "editor", "customer"],
      order_status: [
        "pending",
        "processing",
        "on_hold",
        "completed",
        "cancelled",
        "refunded",
      ],
      task_recurrence_type: ["daily", "weekly", "monthly", "every_x_days"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "skipped",
        "overdue",
      ],
      ticket_status: ["open", "closed"],
    },
  },
} as const
