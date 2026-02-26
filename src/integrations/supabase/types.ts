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
      abandoned_carts: {
        Row: {
          cart_data: Json | null
          cart_total: number | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_recovered: boolean | null
          last_activity_at: string | null
          phone: string | null
          recovered_order_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cart_data?: Json | null
          cart_total?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_recovered?: boolean | null
          last_activity_at?: string | null
          phone?: string | null
          recovered_order_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cart_data?: Json | null
          cart_total?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_recovered?: boolean | null
          last_activity_at?: string | null
          phone?: string | null
          recovered_order_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_recovered_order_id_fkey"
            columns: ["recovered_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          address_line: string
          created_at: string
          district: string
          division: string
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          thana: string
          user_id: string
        }
        Insert: {
          address_line: string
          created_at?: string
          district: string
          division: string
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          thana: string
          user_id: string
        }
        Update: {
          address_line?: string
          created_at?: string
          district?: string
          division?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          thana?: string
          user_id?: string
        }
        Relationships: []
      }
      announcement_bar: {
        Row: {
          background_color: string | null
          created_at: string | null
          display_order: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          message: string
          message_bn: string | null
          show_on_desktop: boolean | null
          show_on_mobile: boolean | null
          start_date: string | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message: string
          message_bn?: string | null
          show_on_desktop?: boolean | null
          show_on_mobile?: boolean | null
          start_date?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message?: string
          message_bn?: string | null
          show_on_desktop?: boolean | null
          show_on_mobile?: boolean | null
          start_date?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blocked_customers: {
        Row: {
          block_reason: string
          blocked_at: string
          blocked_by: string | null
          email: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          phone: string | null
          unblocked_at: string | null
          user_id: string | null
        }
        Insert: {
          block_reason: string
          blocked_at?: string
          blocked_by?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          phone?: string | null
          unblocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          block_reason?: string
          blocked_at?: string
          blocked_by?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          phone?: string | null
          unblocked_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_bn: string | null
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_bn?: string | null
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_bn?: string | null
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          content_bn: string | null
          created_at: string
          excerpt: string | null
          excerpt_bn: string | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          published_at: string | null
          slug: string
          title: string
          title_bn: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          content_bn?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_bn?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          title_bn?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          content_bn?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_bn?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          title_bn?: string | null
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
      blog_settings: {
        Row: {
          banner_image_url: string | null
          banner_link: string | null
          banner_title: string | null
          banner_title_bn: string | null
          created_at: string
          id: string
          is_blog_active: boolean | null
          posts_per_page: number | null
          show_banner: boolean | null
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          banner_link?: string | null
          banner_title?: string | null
          banner_title_bn?: string | null
          created_at?: string
          id?: string
          is_blog_active?: boolean | null
          posts_per_page?: number | null
          show_banner?: boolean | null
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          banner_link?: string | null
          banner_title?: string | null
          banner_title_bn?: string | null
          created_at?: string
          id?: string
          is_blog_active?: boolean | null
          posts_per_page?: number | null
          show_banner?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      bundle_products: {
        Row: {
          bundle_id: string | null
          category_id: string | null
          created_at: string
          id: string
          product_id: string | null
        }
        Insert: {
          bundle_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
        }
        Update: {
          bundle_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_products_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          customization_details: Json | null
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          customization_details?: Json | null
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          customization_details?: Json | null
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon_emoji: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          mobile_image_url: string | null
          name: string
          name_bn: string | null
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_emoji?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          mobile_image_url?: string | null
          name: string
          name_bn?: string | null
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_emoji?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          mobile_image_url?: string | null
          name?: string
          name_bn?: string | null
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_display_settings: {
        Row: {
          auto_slide: boolean | null
          card_shape: string | null
          columns_desktop: number | null
          columns_mobile: number | null
          columns_tablet: number | null
          created_at: string
          enable_slider: boolean | null
          id: string
          items_to_show: number | null
          section_subtitle: string | null
          section_title: string | null
          show_description: boolean | null
          show_subtitle: boolean | null
          slide_interval: number | null
          updated_at: string
        }
        Insert: {
          auto_slide?: boolean | null
          card_shape?: string | null
          columns_desktop?: number | null
          columns_mobile?: number | null
          columns_tablet?: number | null
          created_at?: string
          enable_slider?: boolean | null
          id?: string
          items_to_show?: number | null
          section_subtitle?: string | null
          section_title?: string | null
          show_description?: boolean | null
          show_subtitle?: boolean | null
          slide_interval?: number | null
          updated_at?: string
        }
        Update: {
          auto_slide?: boolean | null
          card_shape?: string | null
          columns_desktop?: number | null
          columns_mobile?: number | null
          columns_tablet?: number | null
          created_at?: string
          enable_slider?: boolean | null
          id?: string
          items_to_show?: number | null
          section_subtitle?: string | null
          section_title?: string | null
          show_description?: boolean | null
          show_subtitle?: boolean | null
          slide_interval?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string
          description: string | null
          description_bn: string | null
          display_order: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          title: string
          title_bn: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          title: string
          title_bn?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          title?: string
          title_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      checkout_fraud_settings: {
        Row: {
          block_suspicious_orders: boolean | null
          created_at: string
          guest_checkout_enabled: boolean | null
          id: string
          max_cod_amount_new_customer: number | null
          max_orders_per_phone_24h: number | null
          order_rate_limit_seconds: number | null
          require_captcha_for_guest: boolean | null
          updated_at: string
        }
        Insert: {
          block_suspicious_orders?: boolean | null
          created_at?: string
          guest_checkout_enabled?: boolean | null
          id?: string
          max_cod_amount_new_customer?: number | null
          max_orders_per_phone_24h?: number | null
          order_rate_limit_seconds?: number | null
          require_captcha_for_guest?: boolean | null
          updated_at?: string
        }
        Update: {
          block_suspicious_orders?: boolean | null
          created_at?: string
          guest_checkout_enabled?: boolean | null
          id?: string
          max_cod_amount_new_customer?: number | null
          max_orders_per_phone_24h?: number | null
          order_rate_limit_seconds?: number | null
          require_captcha_for_guest?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      checkout_settings: {
        Row: {
          cod_enabled: boolean | null
          cod_extra_charge: number | null
          created_at: string
          default_shipping_cost: number | null
          free_shipping_threshold: number | null
          id: string
          min_order_amount: number | null
          require_address: boolean | null
          require_phone: boolean | null
          show_gift_message: boolean | null
          show_order_notes: boolean | null
          show_promo_code: boolean | null
          show_shipping_calculator: boolean | null
          updated_at: string
        }
        Insert: {
          cod_enabled?: boolean | null
          cod_extra_charge?: number | null
          created_at?: string
          default_shipping_cost?: number | null
          free_shipping_threshold?: number | null
          id?: string
          min_order_amount?: number | null
          require_address?: boolean | null
          require_phone?: boolean | null
          show_gift_message?: boolean | null
          show_order_notes?: boolean | null
          show_promo_code?: boolean | null
          show_shipping_calculator?: boolean | null
          updated_at?: string
        }
        Update: {
          cod_enabled?: boolean | null
          cod_extra_charge?: number | null
          created_at?: string
          default_shipping_cost?: number | null
          free_shipping_threshold?: number | null
          id?: string
          min_order_amount?: number | null
          require_address?: boolean | null
          require_phone?: boolean | null
          show_gift_message?: boolean | null
          show_order_notes?: boolean | null
          show_promo_code?: boolean | null
          show_shipping_calculator?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          description_bn: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          name_bn: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          name_bn?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          name_bn?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          content: string
          content_bn: string | null
          created_at: string
          id: string
          is_active: boolean | null
          lang1_label: string | null
          lang2_label: string | null
          meta_description: string | null
          meta_title: string | null
          page_key: string
          title: string
          title_bn: string | null
          updated_at: string
        }
        Insert: {
          content?: string
          content_bn?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          lang1_label?: string | null
          lang2_label?: string | null
          meta_description?: string | null
          meta_title?: string | null
          page_key: string
          title: string
          title_bn?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          content_bn?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          lang1_label?: string | null
          lang2_label?: string | null
          meta_description?: string | null
          meta_title?: string | null
          page_key?: string
          title?: string
          title_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_reports: {
        Row: {
          created_at: string | null
          data: Json | null
          date_from: string
          date_to: string
          generated_by: string | null
          id: string
          report_type: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          date_from: string
          date_to: string
          generated_by?: string | null
          id?: string
          report_type: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          date_from?: string
          date_to?: string
          generated_by?: string | null
          id?: string
          report_type?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          currency_code: string
          currency_name: string
          id: string
          is_active: boolean | null
          rate_to_bdt: number
          symbol: string
          updated_at: string
        }
        Insert: {
          currency_code: string
          currency_name: string
          id?: string
          is_active?: boolean | null
          rate_to_bdt?: number
          symbol: string
          updated_at?: string
        }
        Update: {
          currency_code?: string
          currency_name?: string
          id?: string
          is_active?: boolean | null
          rate_to_bdt?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_order_requests: {
        Row: {
          address_line: string | null
          admin_notes: string | null
          advance_amount: number | null
          advance_paid: boolean | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          delivery_notes: string | null
          description: string
          district: string | null
          division: string | null
          email: string | null
          estimated_price: number | null
          estimated_time: string | null
          full_name: string | null
          id: string
          payment_method: string | null
          payment_transaction_id: string | null
          phone: string | null
          product_id: string | null
          reference_image_url: string
          status: Database["public"]["Enums"]["custom_order_status"] | null
          thana: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line?: string | null
          admin_notes?: string | null
          advance_amount?: number | null
          advance_paid?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          delivery_notes?: string | null
          description: string
          district?: string | null
          division?: string | null
          email?: string | null
          estimated_price?: number | null
          estimated_time?: string | null
          full_name?: string | null
          id?: string
          payment_method?: string | null
          payment_transaction_id?: string | null
          phone?: string | null
          product_id?: string | null
          reference_image_url: string
          status?: Database["public"]["Enums"]["custom_order_status"] | null
          thana?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string | null
          admin_notes?: string | null
          advance_amount?: number | null
          advance_paid?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          delivery_notes?: string | null
          description?: string
          district?: string | null
          division?: string | null
          email?: string | null
          estimated_price?: number | null
          estimated_time?: string | null
          full_name?: string | null
          id?: string
          payment_method?: string | null
          payment_transaction_id?: string | null
          phone?: string | null
          product_id?: string | null
          reference_image_url?: string
          status?: Database["public"]["Enums"]["custom_order_status"] | null
          thana?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_order_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_discount_credits: {
        Row: {
          created_at: string | null
          discount_type: string | null
          discount_value: number
          expires_at: string | null
          id: string
          is_used: boolean | null
          order_id: string | null
          source: string | null
          used_at: string | null
          used_on_order_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount_type?: string | null
          discount_value: number
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          order_id?: string | null
          source?: string | null
          used_at?: string | null
          used_on_order_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          order_id?: string | null
          source?: string | null
          used_at?: string | null
          used_on_order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_discount_credits_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_discount_credits_used_on_order_id_fkey"
            columns: ["used_on_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          discount_percentage: number | null
          email: string
          full_name: string
          id: string
          is_premium_member: boolean | null
          notes: string | null
          phone: string | null
          premium_expires_at: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number | null
          email: string
          full_name: string
          id?: string
          is_premium_member?: boolean | null
          notes?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number | null
          email?: string
          full_name?: string
          id?: string
          is_premium_member?: boolean | null
          notes?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customization_settings: {
        Row: {
          created_at: string
          custom_order_enabled: boolean | null
          default_advance_percent: number | null
          form_description_label: string | null
          form_description_placeholder: string | null
          form_subtitle: string | null
          form_subtitle_bn: string | null
          form_title: string | null
          form_title_bn: string | null
          header_button_enabled: boolean | null
          header_button_icon: string | null
          header_button_link: string | null
          header_button_text: string | null
          header_button_text_bn: string | null
          id: string
          max_advance_percent: number | null
          min_advance_percent: number | null
          require_image: boolean | null
          show_budget_fields: boolean | null
          success_message: string | null
          success_message_bn: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_order_enabled?: boolean | null
          default_advance_percent?: number | null
          form_description_label?: string | null
          form_description_placeholder?: string | null
          form_subtitle?: string | null
          form_subtitle_bn?: string | null
          form_title?: string | null
          form_title_bn?: string | null
          header_button_enabled?: boolean | null
          header_button_icon?: string | null
          header_button_link?: string | null
          header_button_text?: string | null
          header_button_text_bn?: string | null
          id?: string
          max_advance_percent?: number | null
          min_advance_percent?: number | null
          require_image?: boolean | null
          show_budget_fields?: boolean | null
          success_message?: string | null
          success_message_bn?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_order_enabled?: boolean | null
          default_advance_percent?: number | null
          form_description_label?: string | null
          form_description_placeholder?: string | null
          form_subtitle?: string | null
          form_subtitle_bn?: string | null
          form_title?: string | null
          form_title_bn?: string | null
          header_button_enabled?: boolean | null
          header_button_icon?: string | null
          header_button_link?: string | null
          header_button_text?: string | null
          header_button_text_bn?: string | null
          id?: string
          max_advance_percent?: number | null
          min_advance_percent?: number | null
          require_image?: boolean | null
          show_budget_fields?: boolean | null
          success_message?: string | null
          success_message_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_partners: {
        Row: {
          api_key: string | null
          api_type: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          api_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          api_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_providers: {
        Row: {
          api_key: string | null
          api_secret: string | null
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          provider_type: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          provider_type: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          provider_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string
          district: string
          division: string
          estimated_days: string | null
          id: string
          is_active: boolean | null
          shipping_cost: number
          thana: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          district: string
          division: string
          estimated_days?: string | null
          id?: string
          is_active?: boolean | null
          shipping_cost?: number
          thana?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          district?: string
          division?: string
          estimated_days?: string | null
          id?: string
          is_active?: boolean | null
          shipping_cost?: number
          thana?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          created_at: string | null
          from_email: string | null
          from_name: string | null
          id: string
          is_enabled: boolean | null
          order_confirmation_template_id: string | null
          provider: string | null
          reply_to_email: string | null
          resend_api_key: string | null
          send_delivery_notification: boolean | null
          send_order_confirmation: boolean | null
          send_shipping_update: boolean | null
          shipping_template_id: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_enabled?: boolean | null
          order_confirmation_template_id?: string | null
          provider?: string | null
          reply_to_email?: string | null
          resend_api_key?: string | null
          send_delivery_notification?: boolean | null
          send_order_confirmation?: boolean | null
          send_shipping_update?: boolean | null
          shipping_template_id?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_enabled?: boolean | null
          order_confirmation_template_id?: string | null
          provider?: string | null
          reply_to_email?: string | null
          resend_api_key?: string | null
          send_delivery_notification?: boolean | null
          send_order_confirmation?: boolean | null
          send_shipping_update?: boolean | null
          shipping_template_id?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          is_active: boolean | null
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean | null
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean | null
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          answer_bn: string | null
          category: string
          category_bn: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          page_type: string | null
          question: string
          question_bn: string | null
          updated_at: string
        }
        Insert: {
          answer: string
          answer_bn?: string | null
          category: string
          category_bn?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          page_type?: string | null
          question: string
          question_bn?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string
          answer_bn?: string | null
          category?: string
          category_bn?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          page_type?: string | null
          question?: string
          question_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      featured_sections: {
        Row: {
          badge_text: string | null
          button_link: string | null
          button_text: string | null
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          layout: string | null
          price_text: string | null
          section_key: string
          title_highlight: string | null
          title_line1: string | null
          updated_at: string | null
        }
        Insert: {
          badge_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          layout?: string | null
          price_text?: string | null
          section_key?: string
          title_highlight?: string | null
          title_line1?: string | null
          updated_at?: string | null
        }
        Update: {
          badge_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          layout?: string | null
          price_text?: string | null
          section_key?: string
          title_highlight?: string | null
          title_line1?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      filter_settings: {
        Row: {
          created_at: string
          display_order: number | null
          filter_key: string
          filter_name: string
          filter_type: string
          id: string
          is_active: boolean | null
          options: Json | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          filter_key: string
          filter_name: string
          filter_type?: string
          id?: string
          is_active?: boolean | null
          options?: Json | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          filter_key?: string
          filter_name?: string
          filter_type?: string
          id?: string
          is_active?: boolean | null
          options?: Json | null
        }
        Relationships: []
      }
      footer_link_groups: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          created_at: string
          display_order: number | null
          group_id: string
          href: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          group_id: string
          href: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          group_id?: string
          href?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "footer_links_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "footer_link_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_albums: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_bn: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          published_at: string | null
          title: string
          title_bn: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          published_at?: string | null
          title: string
          title_bn?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          published_at?: string | null
          title?: string
          title_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          album_id: string | null
          created_at: string
          description: string | null
          description_bn: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          media_type: string | null
          media_url: string
          title: string | null
          title_bn: string | null
        }
        Insert: {
          album_id?: string | null
          created_at?: string
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          media_url: string
          title?: string | null
          title_bn?: string | null
        }
        Update: {
          album_id?: string | null
          created_at?: string
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          media_url?: string
          title?: string | null
          title_bn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "gallery_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          animation_type: string | null
          badge_text: string | null
          button_link: string | null
          button_text: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_fit: string | null
          image_link_url: string | null
          image_url: string | null
          is_active: boolean | null
          overlay_enabled: boolean | null
          overlay_opacity: number | null
          overlay_position: string | null
          secondary_button_link: string | null
          secondary_button_text: string | null
          show_badge: boolean | null
          show_description: boolean | null
          show_primary_button: boolean | null
          show_secondary_button: boolean | null
          show_title: boolean | null
          text_alignment: string | null
          title: string | null
          title_end: string | null
          title_highlight: string | null
          updated_at: string
        }
        Insert: {
          animation_type?: string | null
          badge_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_fit?: string | null
          image_link_url?: string | null
          image_url?: string | null
          is_active?: boolean | null
          overlay_enabled?: boolean | null
          overlay_opacity?: number | null
          overlay_position?: string | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          show_badge?: boolean | null
          show_description?: boolean | null
          show_primary_button?: boolean | null
          show_secondary_button?: boolean | null
          show_title?: boolean | null
          text_alignment?: string | null
          title?: string | null
          title_end?: string | null
          title_highlight?: string | null
          updated_at?: string
        }
        Update: {
          animation_type?: string | null
          badge_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_fit?: string | null
          image_link_url?: string | null
          image_url?: string | null
          is_active?: boolean | null
          overlay_enabled?: boolean | null
          overlay_opacity?: number | null
          overlay_position?: string | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          show_badge?: boolean | null
          show_description?: boolean | null
          show_primary_button?: boolean | null
          show_secondary_button?: boolean | null
          show_title?: boolean | null
          text_alignment?: string | null
          title?: string | null
          title_end?: string | null
          title_highlight?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_content: {
        Row: {
          content: Json
          created_at: string
          display_order: number | null
          id: string
          instagram_access_token: string | null
          instagram_user_id: string | null
          is_active: boolean | null
          section_key: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          instagram_access_token?: string | null
          instagram_user_id?: string | null
          is_active?: boolean | null
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          instagram_access_token?: string | null
          instagram_user_id?: string | null
          is_active?: boolean | null
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          config: Json
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          section_type: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_type: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_type?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      instagram_posts: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
        }
        Relationships: []
      }
      invoice_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          company_tagline: string | null
          created_at: string
          digital_signature_url: string | null
          footer_note: string | null
          id: string
          logo_url: string | null
          show_social_links: boolean | null
          signatory_name: string | null
          signatory_title: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_website: string | null
          social_whatsapp: string | null
          terms_and_conditions: string | null
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_tagline?: string | null
          created_at?: string
          digital_signature_url?: string | null
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          show_social_links?: boolean | null
          signatory_name?: string | null
          signatory_title?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_website?: string | null
          social_whatsapp?: string | null
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_tagline?: string | null
          created_at?: string
          digital_signature_url?: string | null
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          show_social_links?: boolean | null
          signatory_name?: string | null
          signatory_title?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_website?: string | null
          social_whatsapp?: string | null
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_contacted: boolean | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_contacted?: boolean | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_contacted?: boolean | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
        }
        Relationships: []
      }
      making_section: {
        Row: {
          background_image_url: string | null
          badge_text: string | null
          button_link: string | null
          button_text: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          overlay_opacity: number | null
          stat1_label: string | null
          stat1_number: string | null
          stat2_label: string | null
          stat2_number: string | null
          stat3_label: string | null
          stat3_number: string | null
          title_highlight: string | null
          title_line1: string | null
          updated_at: string | null
        }
        Insert: {
          background_image_url?: string | null
          badge_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          overlay_opacity?: number | null
          stat1_label?: string | null
          stat1_number?: string | null
          stat2_label?: string | null
          stat2_number?: string | null
          stat3_label?: string | null
          stat3_number?: string | null
          title_highlight?: string | null
          title_line1?: string | null
          updated_at?: string | null
        }
        Update: {
          background_image_url?: string | null
          badge_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          overlay_opacity?: number | null
          stat1_label?: string | null
          stat1_number?: string | null
          stat2_label?: string | null
          stat2_number?: string | null
          stat3_label?: string | null
          stat3_number?: string | null
          title_highlight?: string | null
          title_line1?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          banner_image_url: string | null
          banner_link: string | null
          banner_subtitle: string | null
          banner_title: string | null
          created_at: string
          display_order: number | null
          href: string
          id: string
          is_active: boolean | null
          is_mega_menu: boolean | null
          menu_type: string | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          banner_link?: string | null
          banner_subtitle?: string | null
          banner_title?: string | null
          created_at?: string
          display_order?: number | null
          href: string
          id?: string
          is_active?: boolean | null
          is_mega_menu?: boolean | null
          menu_type?: string | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          banner_link?: string | null
          banner_subtitle?: string | null
          banner_title?: string | null
          created_at?: string
          display_order?: number | null
          href?: string
          id?: string
          is_active?: boolean | null
          is_mega_menu?: boolean | null
          menu_type?: string | null
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_sub_items: {
        Row: {
          created_at: string
          display_order: number | null
          href: string
          id: string
          image_url: string | null
          is_active: boolean | null
          items: string[] | null
          menu_item_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          href: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          items?: string[] | null
          menu_item_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          href?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          items?: string[] | null
          menu_item_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_sub_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_settings: {
        Row: {
          button_text: string | null
          button_text_bn: string | null
          created_at: string
          id: string
          is_enabled: boolean | null
          placeholder_text: string | null
          subtitle: string | null
          subtitle_bn: string | null
          success_message: string | null
          title: string | null
          title_bn: string | null
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          button_text_bn?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          placeholder_text?: string | null
          subtitle?: string | null
          subtitle_bn?: string | null
          success_message?: string | null
          title?: string | null
          title_bn?: string | null
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          button_text_bn?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          placeholder_text?: string | null
          subtitle?: string | null
          subtitle_bn?: string | null
          success_message?: string | null
          title?: string | null
          title_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          source: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_global: boolean | null
          is_read: boolean | null
          link_url: string | null
          message: string
          message_bn: string | null
          title: string
          title_bn: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_global?: boolean | null
          is_read?: boolean | null
          link_url?: string | null
          message: string
          message_bn?: string | null
          title: string
          title_bn?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_global?: boolean | null
          is_read?: boolean | null
          link_url?: string | null
          message?: string
          message_bn?: string | null
          title?: string
          title_bn?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_fraud_flags: {
        Row: {
          created_at: string
          flag_reason: string
          flag_type: string
          id: string
          is_resolved: boolean | null
          order_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          flag_reason: string
          flag_type: string
          id?: string
          is_resolved?: boolean | null
          order_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          created_at?: string
          flag_reason?: string
          flag_type?: string
          id?: string
          is_resolved?: boolean | null
          order_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_fraud_flags_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          customization_details: Json | null
          id: string
          is_preorder: boolean | null
          order_id: string
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          customization_details?: Json | null
          id?: string
          is_preorder?: boolean | null
          order_id: string
          product_id?: string | null
          product_name: string
          product_price: number
          quantity?: number
        }
        Update: {
          created_at?: string
          customization_details?: Json | null
          id?: string
          is_preorder?: boolean | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
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
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          created_at: string
          delivered_at: string | null
          delivery_partner_id: string | null
          device_fingerprint: string | null
          fraud_score: number | null
          id: string
          ip_address: string | null
          is_flagged: boolean | null
          is_preorder: boolean | null
          notes: string | null
          order_number: string
          partner_payment_amount: number | null
          partner_payment_date: string | null
          partner_payment_status: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_transaction_id: string | null
          qr_code_id: string | null
          qr_discount_claimed: boolean | null
          qr_discount_claimed_at: string | null
          return_reason: string | null
          return_requested_at: string | null
          shipped_at: string | null
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_partner_id?: string | null
          device_fingerprint?: string | null
          fraud_score?: number | null
          id?: string
          ip_address?: string | null
          is_flagged?: boolean | null
          is_preorder?: boolean | null
          notes?: string | null
          order_number: string
          partner_payment_amount?: number | null
          partner_payment_date?: string | null
          partner_payment_status?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_transaction_id?: string | null
          qr_code_id?: string | null
          qr_discount_claimed?: boolean | null
          qr_discount_claimed_at?: string | null
          return_reason?: string | null
          return_requested_at?: string | null
          shipped_at?: string | null
          shipping_cost: number
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_partner_id?: string | null
          device_fingerprint?: string | null
          fraud_score?: number | null
          id?: string
          ip_address?: string | null
          is_flagged?: boolean | null
          is_preorder?: boolean | null
          notes?: string | null
          order_number?: string
          partner_payment_amount?: number | null
          partner_payment_date?: string | null
          partner_payment_status?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_transaction_id?: string | null
          qr_code_id?: string | null
          qr_discount_claimed?: boolean | null
          qr_discount_claimed_at?: string | null
          return_reason?: string | null
          return_requested_at?: string | null
          shipped_at?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_partner_id_fkey"
            columns: ["delivery_partner_id"]
            isOneToOne: false
            referencedRelation: "delivery_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_providers: {
        Row: {
          account_number: string | null
          account_type: string | null
          config: Json | null
          created_at: string
          id: string
          instructions: string | null
          instructions_bn: string | null
          is_active: boolean | null
          is_sandbox: boolean | null
          name: string
          payment_mode: string | null
          provider_type: string
          qr_code_image: string | null
          store_id: string | null
          store_password: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          instructions?: string | null
          instructions_bn?: string | null
          is_active?: boolean | null
          is_sandbox?: boolean | null
          name: string
          payment_mode?: string | null
          provider_type: string
          qr_code_image?: string | null
          store_id?: string | null
          store_password?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          instructions?: string | null
          instructions_bn?: string | null
          is_active?: boolean | null
          is_sandbox?: boolean | null
          name?: string
          payment_mode?: string | null
          provider_type?: string
          qr_code_image?: string | null
          store_id?: string | null
          store_password?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string | null
          error_message: string | null
          gateway_code: string
          gateway_response: Json | null
          id: string
          order_id: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          error_message?: string | null
          gateway_code: string
          gateway_response?: Json | null
          id?: string
          order_id?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          error_message?: string | null
          gateway_code?: string
          gateway_response?: Json | null
          id?: string
          order_id?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          trigger_category_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_category_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_bundles_trigger_category_id_fkey"
            columns: ["trigger_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colors: {
        Row: {
          color_code: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_bn: string | null
        }
        Insert: {
          color_code: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_bn?: string | null
        }
        Update: {
          color_code?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_bn?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          order_id: string | null
          order_number: string
          product_id: string
          rating: number
          review_text: string
          reviewer_name: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          order_number: string
          product_id: string
          rating: number
          review_text: string
          reviewer_name?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          order_number?: string
          product_id?: string
          rating?: number
          review_text?: string
          reviewer_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_bn: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_bn?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_bn?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          color: string | null
          color_code: string | null
          created_at: string
          display_order: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          price_adjustment: number | null
          product_id: string
          size: string | null
          sku: string | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          color_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          price_adjustment?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          color_code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          price_adjustment?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          advance_payment_percent: number | null
          allow_customization: boolean | null
          care_instructions: string | null
          care_instructions_bn: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          customization_instructions: string | null
          customization_only: boolean | null
          description: string | null
          dimensions: string | null
          featured_section: string | null
          features: string[] | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          is_preorderable: boolean | null
          is_showcase: boolean | null
          materials: string | null
          materials_bn: string | null
          name: string
          name_bn: string | null
          price: number
          production_time: string | null
          showcase_description: string | null
          showcase_description_bn: string | null
          slug: string
          stock_quantity: number | null
          story: string | null
          story_bn: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          advance_payment_percent?: number | null
          allow_customization?: boolean | null
          care_instructions?: string | null
          care_instructions_bn?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          customization_instructions?: string | null
          customization_only?: boolean | null
          description?: string | null
          dimensions?: string | null
          featured_section?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_preorderable?: boolean | null
          is_showcase?: boolean | null
          materials?: string | null
          materials_bn?: string | null
          name: string
          name_bn?: string | null
          price: number
          production_time?: string | null
          showcase_description?: string | null
          showcase_description_bn?: string | null
          slug: string
          stock_quantity?: number | null
          story?: string | null
          story_bn?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          advance_payment_percent?: number | null
          allow_customization?: boolean | null
          care_instructions?: string | null
          care_instructions_bn?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          customization_instructions?: string | null
          customization_only?: boolean | null
          description?: string | null
          dimensions?: string | null
          featured_section?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_preorderable?: boolean | null
          is_showcase?: boolean | null
          materials?: string | null
          materials_bn?: string | null
          name?: string
          name_bn?: string | null
          price?: number
          production_time?: string | null
          showcase_description?: string | null
          showcase_description_bn?: string | null
          slug?: string
          stock_quantity?: number | null
          story?: string | null
          story_bn?: string | null
          updated_at?: string
          video_url?: string | null
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
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          discount_applied: number
          id: string
          order_id: string | null
          promo_code_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          discount_applied: number
          id?: string
          order_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          discount_applied?: number
          id?: string
          order_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_categories: string[] | null
          applicable_products: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string | null
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      qr_discount_settings: {
        Row: {
          created_at: string | null
          discount_percent: number | null
          discount_type: string | null
          discount_value: number | null
          expires_after_days: number | null
          id: string
          is_active: boolean | null
          message: string | null
          message_bn: string | null
          min_order_value: number | null
          updated_at: string | null
          usage_limit_per_customer: number | null
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_after_days?: number | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          message_bn?: string | null
          min_order_value?: number | null
          updated_at?: string | null
          usage_limit_per_customer?: number | null
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_after_days?: number | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          message_bn?: string | null
          min_order_value?: number | null
          updated_at?: string | null
          usage_limit_per_customer?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_page_settings: {
        Row: {
          created_at: string
          hero_background_image: string | null
          hero_overlay_opacity: number | null
          hero_subtitle: string | null
          hero_subtitle_bn: string | null
          hero_title: string | null
          hero_title_bn: string | null
          id: string
          sales_banner_enabled: boolean | null
          sales_banner_end_date: string | null
          sales_banner_image: string | null
          sales_banner_link: string | null
          sales_banner_start_date: string | null
          sales_banner_title: string | null
          sales_banner_title_bn: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_background_image?: string | null
          hero_overlay_opacity?: number | null
          hero_subtitle?: string | null
          hero_subtitle_bn?: string | null
          hero_title?: string | null
          hero_title_bn?: string | null
          id?: string
          sales_banner_enabled?: boolean | null
          sales_banner_end_date?: string | null
          sales_banner_image?: string | null
          sales_banner_link?: string | null
          sales_banner_start_date?: string | null
          sales_banner_title?: string | null
          sales_banner_title_bn?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_background_image?: string | null
          hero_overlay_opacity?: number | null
          hero_subtitle?: string | null
          hero_subtitle_bn?: string | null
          hero_title?: string | null
          hero_title_bn?: string | null
          id?: string
          sales_banner_enabled?: boolean | null
          sales_banner_end_date?: string | null
          sales_banner_image?: string | null
          sales_banner_link?: string | null
          sales_banner_start_date?: string | null
          sales_banner_title?: string | null
          sales_banner_title_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          created_at: string | null
          default_sort: string | null
          filter_position: string | null
          id: string
          max_price: number | null
          min_price: number | null
          price_step: number | null
          products_per_page: number | null
          promo_banner_image: string | null
          promo_banner_link: string | null
          promo_banner_position: string | null
          sales_banner_bg_color: string | null
          sales_banner_link: string | null
          sales_banner_position: string | null
          sales_banner_text: string | null
          sales_banner_text_bn: string | null
          sales_banner_text_color: string | null
          show_out_of_stock: boolean | null
          show_promo_banner: boolean | null
          show_sales_banner: boolean | null
          show_showcase_products: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_sort?: string | null
          filter_position?: string | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          price_step?: number | null
          products_per_page?: number | null
          promo_banner_image?: string | null
          promo_banner_link?: string | null
          promo_banner_position?: string | null
          sales_banner_bg_color?: string | null
          sales_banner_link?: string | null
          sales_banner_position?: string | null
          sales_banner_text?: string | null
          sales_banner_text_bn?: string | null
          sales_banner_text_color?: string | null
          show_out_of_stock?: boolean | null
          show_promo_banner?: boolean | null
          show_sales_banner?: boolean | null
          show_showcase_products?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_sort?: string | null
          filter_position?: string | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          price_step?: number | null
          products_per_page?: number | null
          promo_banner_image?: string | null
          promo_banner_link?: string | null
          promo_banner_position?: string | null
          sales_banner_bg_color?: string | null
          sales_banner_link?: string | null
          sales_banner_position?: string | null
          sales_banner_text?: string | null
          sales_banner_text_bn?: string | null
          sales_banner_text_color?: string | null
          show_out_of_stock?: boolean | null
          show_promo_banner?: boolean | null
          show_sales_banner?: boolean | null
          show_showcase_products?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_branding: {
        Row: {
          auto_sync_google_reviews: boolean | null
          business_hours: string | null
          business_hours_bn: string | null
          contact_address: string | null
          contact_address_bn: string | null
          contact_page_subtitle: string | null
          contact_page_subtitle_bn: string | null
          contact_page_title: string | null
          contact_page_title_bn: string | null
          contact_phone: string | null
          created_at: string
          favicon_url: string | null
          footer_banner_height: number | null
          footer_banner_link: string | null
          footer_banner_url: string | null
          footer_copyright: string | null
          footer_description: string | null
          footer_left_logo_link: string | null
          footer_left_logo_url: string | null
          footer_logo_size: string | null
          footer_right_logo_link: string | null
          footer_right_logo_url: string | null
          google_api_key: string | null
          google_maps_embed_url: string | null
          google_place_id: string | null
          header_announcement_active: boolean | null
          header_announcement_text: string | null
          header_logo_size: string | null
          hide_manual_reviews_when_api_active: boolean | null
          id: string
          logo_text: string | null
          logo_text_secondary: string | null
          logo_url: string | null
          payment_methods: Json | null
          show_logo_text: boolean | null
          signup_discount_enabled: boolean | null
          signup_discount_percent: number | null
          social_email: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          auto_sync_google_reviews?: boolean | null
          business_hours?: string | null
          business_hours_bn?: string | null
          contact_address?: string | null
          contact_address_bn?: string | null
          contact_page_subtitle?: string | null
          contact_page_subtitle_bn?: string | null
          contact_page_title?: string | null
          contact_page_title_bn?: string | null
          contact_phone?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_banner_height?: number | null
          footer_banner_link?: string | null
          footer_banner_url?: string | null
          footer_copyright?: string | null
          footer_description?: string | null
          footer_left_logo_link?: string | null
          footer_left_logo_url?: string | null
          footer_logo_size?: string | null
          footer_right_logo_link?: string | null
          footer_right_logo_url?: string | null
          google_api_key?: string | null
          google_maps_embed_url?: string | null
          google_place_id?: string | null
          header_announcement_active?: boolean | null
          header_announcement_text?: string | null
          header_logo_size?: string | null
          hide_manual_reviews_when_api_active?: boolean | null
          id?: string
          logo_text?: string | null
          logo_text_secondary?: string | null
          logo_url?: string | null
          payment_methods?: Json | null
          show_logo_text?: boolean | null
          signup_discount_enabled?: boolean | null
          signup_discount_percent?: number | null
          social_email?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          auto_sync_google_reviews?: boolean | null
          business_hours?: string | null
          business_hours_bn?: string | null
          contact_address?: string | null
          contact_address_bn?: string | null
          contact_page_subtitle?: string | null
          contact_page_subtitle_bn?: string | null
          contact_page_title?: string | null
          contact_page_title_bn?: string | null
          contact_phone?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_banner_height?: number | null
          footer_banner_link?: string | null
          footer_banner_url?: string | null
          footer_copyright?: string | null
          footer_description?: string | null
          footer_left_logo_link?: string | null
          footer_left_logo_url?: string | null
          footer_logo_size?: string | null
          footer_right_logo_link?: string | null
          footer_right_logo_url?: string | null
          google_api_key?: string | null
          google_maps_embed_url?: string | null
          google_place_id?: string | null
          header_announcement_active?: boolean | null
          header_announcement_text?: string | null
          header_logo_size?: string | null
          hide_manual_reviews_when_api_active?: boolean | null
          id?: string
          logo_text?: string | null
          logo_text_secondary?: string | null
          logo_url?: string | null
          payment_methods?: Json | null
          show_logo_text?: boolean | null
          signup_discount_enabled?: boolean | null
          signup_discount_percent?: number | null
          social_email?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_integrations: {
        Row: {
          created_at: string | null
          id: string
          integration_key: string
          is_active: boolean | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          integration_key: string
          is_active?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          integration_key?: string
          is_active?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          message: string
          message_type: string | null
          provider: string | null
          recipient: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          message: string
          message_type?: string | null
          provider?: string | null
          recipient: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          message?: string
          message_type?: string | null
          provider?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      sms_settings: {
        Row: {
          api_key: string | null
          api_secret: string | null
          config: Json | null
          created_at: string
          id: string
          is_enabled: boolean | null
          provider: string | null
          send_delivery_notification: boolean | null
          send_order_confirmation: boolean | null
          send_otp: boolean | null
          send_shipping_update: boolean | null
          sender_id: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          provider?: string | null
          send_delivery_notification?: boolean | null
          send_order_confirmation?: boolean | null
          send_otp?: boolean | null
          send_shipping_update?: boolean | null
          sender_id?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          provider?: string | null
          send_delivery_notification?: boolean | null
          send_order_confirmation?: boolean | null
          send_otp?: boolean | null
          send_shipping_update?: boolean | null
          sender_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          platform: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          bio_bn: string | null
          created_at: string
          display_order: number | null
          email: string | null
          facebook_url: string | null
          id: string
          is_active: boolean | null
          linkedin_url: string | null
          name: string
          name_bn: string | null
          phone: string | null
          photo_url: string | null
          role: string
          role_bn: string | null
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          bio_bn?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name: string
          name_bn?: string | null
          phone?: string | null
          photo_url?: string | null
          role: string
          role_bn?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          bio_bn?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name?: string
          name_bn?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string
          role_bn?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          customer_photo_url: string | null
          display_order: number | null
          google_place_id: string | null
          google_review_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          name: string
          order_id: string | null
          platform: string | null
          product_id: string | null
          rating: number | null
          review_date: string | null
          source: string | null
          text: string
          verified_purchase: boolean | null
        }
        Insert: {
          created_at?: string
          customer_photo_url?: string | null
          display_order?: number | null
          google_place_id?: string | null
          google_review_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          name: string
          order_id?: string | null
          platform?: string | null
          product_id?: string | null
          rating?: number | null
          review_date?: string | null
          source?: string | null
          text: string
          verified_purchase?: boolean | null
        }
        Update: {
          created_at?: string
          customer_photo_url?: string | null
          display_order?: number | null
          google_place_id?: string | null
          google_review_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string
          order_id?: string | null
          platform?: string | null
          product_id?: string | null
          rating?: number | null
          review_date?: string | null
          source?: string | null
          text?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      upsell_offers: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number | null
          display_order: number | null
          id: string
          is_active: boolean | null
          product_id: string | null
          title: string
          trigger_categories: string[] | null
          trigger_type: string | null
          trigger_value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          title: string
          trigger_categories?: string[] | null
          trigger_type?: string | null
          trigger_value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          title?: string
          trigger_categories?: string[] | null
          trigger_type?: string | null
          trigger_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upsell_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_videos: {
        Row: {
          created_at: string
          description: string | null
          description_bn: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          title_bn: string | null
          updated_at: string
          video_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          title_bn?: string | null
          updated_at?: string
          video_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_bn?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          title_bn?: string | null
          updated_at?: string
          video_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_site_branding: {
        Row: {
          auto_sync_google_reviews: boolean | null
          business_hours: string | null
          business_hours_bn: string | null
          contact_address: string | null
          contact_address_bn: string | null
          contact_page_subtitle: string | null
          contact_page_subtitle_bn: string | null
          contact_page_title: string | null
          contact_page_title_bn: string | null
          contact_phone: string | null
          created_at: string | null
          favicon_url: string | null
          footer_banner_height: number | null
          footer_banner_link: string | null
          footer_banner_url: string | null
          footer_copyright: string | null
          footer_description: string | null
          footer_left_logo_link: string | null
          footer_left_logo_url: string | null
          footer_logo_size: string | null
          footer_right_logo_link: string | null
          footer_right_logo_url: string | null
          google_maps_embed_url: string | null
          header_announcement_active: boolean | null
          header_announcement_text: string | null
          hide_manual_reviews_when_api_active: boolean | null
          id: string | null
          logo_text: string | null
          logo_text_secondary: string | null
          logo_url: string | null
          payment_methods: Json | null
          show_logo_text: boolean | null
          signup_discount_enabled: boolean | null
          signup_discount_percent: number | null
          social_email: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_whatsapp: string | null
          updated_at: string | null
        }
        Insert: {
          auto_sync_google_reviews?: boolean | null
          business_hours?: string | null
          business_hours_bn?: string | null
          contact_address?: string | null
          contact_address_bn?: string | null
          contact_page_subtitle?: string | null
          contact_page_subtitle_bn?: string | null
          contact_page_title?: string | null
          contact_page_title_bn?: string | null
          contact_phone?: string | null
          created_at?: string | null
          favicon_url?: string | null
          footer_banner_height?: number | null
          footer_banner_link?: string | null
          footer_banner_url?: string | null
          footer_copyright?: string | null
          footer_description?: string | null
          footer_left_logo_link?: string | null
          footer_left_logo_url?: string | null
          footer_logo_size?: string | null
          footer_right_logo_link?: string | null
          footer_right_logo_url?: string | null
          google_maps_embed_url?: string | null
          header_announcement_active?: boolean | null
          header_announcement_text?: string | null
          hide_manual_reviews_when_api_active?: boolean | null
          id?: string | null
          logo_text?: string | null
          logo_text_secondary?: string | null
          logo_url?: string | null
          payment_methods?: Json | null
          show_logo_text?: boolean | null
          signup_discount_enabled?: boolean | null
          signup_discount_percent?: number | null
          social_email?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_sync_google_reviews?: boolean | null
          business_hours?: string | null
          business_hours_bn?: string | null
          contact_address?: string | null
          contact_address_bn?: string | null
          contact_page_subtitle?: string | null
          contact_page_subtitle_bn?: string | null
          contact_page_title?: string | null
          contact_page_title_bn?: string | null
          contact_phone?: string | null
          created_at?: string | null
          favicon_url?: string | null
          footer_banner_height?: number | null
          footer_banner_link?: string | null
          footer_banner_url?: string | null
          footer_copyright?: string | null
          footer_description?: string | null
          footer_left_logo_link?: string | null
          footer_left_logo_url?: string | null
          footer_logo_size?: string | null
          footer_right_logo_link?: string | null
          footer_right_logo_url?: string | null
          google_maps_embed_url?: string | null
          header_announcement_active?: boolean | null
          header_announcement_text?: string | null
          hide_manual_reviews_when_api_active?: boolean | null
          id?: string | null
          logo_text?: string | null
          logo_text_secondary?: string | null
          logo_url?: string | null
          payment_methods?: Json | null
          show_logo_text?: boolean | null
          signup_discount_enabled?: boolean | null
          signup_discount_percent?: number | null
          social_email?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_submit_lead: {
        Args: { p_email: string; p_phone: string }
        Returns: boolean
      }
      can_subscribe_newsletter: { Args: { p_email: string }; Returns: boolean }
      decrypt_credential: {
        Args: { encrypted_text: string; encryption_key: string }
        Returns: string
      }
      encrypt_credential: { Args: { plaintext: string }; Returns: string }
      encrypt_credential_value: {
        Args: { encryption_key: string; plaintext: string }
        Returns: string
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      custom_order_status:
        | "pending"
        | "approved"
        | "rejected"
        | "in_production"
        | "completed"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_method:
        | "cod"
        | "bkash"
        | "nagad"
        | "bank_transfer"
        | "sslcommerz"
        | "aamarpay"
        | "surjopay"
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
      custom_order_status: [
        "pending",
        "approved",
        "rejected",
        "in_production",
        "completed",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_method: [
        "cod",
        "bkash",
        "nagad",
        "bank_transfer",
        "sslcommerz",
        "aamarpay",
        "surjopay",
      ],
    },
  },
} as const
