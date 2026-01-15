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
      blog_posts: {
        Row: {
          author_id: string | null
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
        Relationships: []
      }
      bundle_products: {
        Row: {
          bundle_id: string | null
          created_at: string
          id: string
          product_id: string | null
        }
        Insert: {
          bundle_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
        }
        Update: {
          bundle_id?: string | null
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
          id: string
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
      content_pages: {
        Row: {
          content: string
          content_bn: string | null
          created_at: string
          id: string
          is_active: boolean | null
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
          meta_description?: string | null
          meta_title?: string | null
          page_key?: string
          title?: string
          title_bn?: string | null
          updated_at?: string
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
          admin_notes: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          description: string
          estimated_price: number | null
          estimated_time: string | null
          id: string
          reference_image_url: string
          status: Database["public"]["Enums"]["custom_order_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description: string
          estimated_price?: number | null
          estimated_time?: string | null
          id?: string
          reference_image_url: string
          status?: Database["public"]["Enums"]["custom_order_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description?: string
          estimated_price?: number | null
          estimated_time?: string | null
          id?: string
          reference_image_url?: string
          status?: Database["public"]["Enums"]["custom_order_status"] | null
          updated_at?: string
          user_id?: string
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
          image_url: string | null
          is_active: boolean | null
          overlay_opacity: number | null
          secondary_button_link: string | null
          secondary_button_text: string | null
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
          image_url?: string | null
          is_active?: boolean | null
          overlay_opacity?: number | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
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
          image_url?: string | null
          is_active?: boolean | null
          overlay_opacity?: number | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
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
          is_active: boolean | null
          section_key: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_key?: string
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
          created_at: string
          footer_note: string | null
          id: string
          logo_url: string | null
          terms_and_conditions: string | null
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          footer_note?: string | null
          id?: string
          logo_url?: string | null
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
          id: string
          is_preorder: boolean | null
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_transaction_id: string | null
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          id?: string
          is_preorder?: boolean | null
          notes?: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_transaction_id?: string | null
          shipping_cost: number
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_id?: string | null
          created_at?: string
          id?: string
          is_preorder?: boolean | null
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_transaction_id?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total?: number
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
        ]
      }
      payment_providers: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          is_sandbox: boolean | null
          name: string
          provider_type: string
          store_id: string | null
          store_password: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          name: string
          provider_type: string
          store_id?: string | null
          store_password?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          name?: string
          provider_type?: string
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
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          allow_customization: boolean | null
          care_instructions: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          dimensions: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          is_preorderable: boolean | null
          materials: string | null
          name: string
          name_bn: string | null
          price: number
          production_time: string | null
          slug: string
          stock_quantity: number | null
          story: string | null
          updated_at: string
        }
        Insert: {
          allow_customization?: boolean | null
          care_instructions?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_preorderable?: boolean | null
          materials?: string | null
          name: string
          name_bn?: string | null
          price: number
          production_time?: string | null
          slug: string
          stock_quantity?: number | null
          story?: string | null
          updated_at?: string
        }
        Update: {
          allow_customization?: boolean | null
          care_instructions?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_preorderable?: boolean | null
          materials?: string | null
          name?: string
          name_bn?: string | null
          price?: number
          production_time?: string | null
          slug?: string
          stock_quantity?: number | null
          story?: string | null
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
      site_branding: {
        Row: {
          created_at: string
          favicon_url: string | null
          footer_copyright: string | null
          footer_description: string | null
          header_announcement_active: boolean | null
          header_announcement_text: string | null
          id: string
          logo_text: string | null
          logo_text_secondary: string | null
          logo_url: string | null
          social_email: string | null
          social_facebook: string | null
          social_instagram: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          favicon_url?: string | null
          footer_copyright?: string | null
          footer_description?: string | null
          header_announcement_active?: boolean | null
          header_announcement_text?: string | null
          id?: string
          logo_text?: string | null
          logo_text_secondary?: string | null
          logo_url?: string | null
          social_email?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          favicon_url?: string | null
          footer_copyright?: string | null
          footer_description?: string | null
          header_announcement_active?: boolean | null
          header_announcement_text?: string | null
          id?: string
          logo_text?: string | null
          logo_text_secondary?: string | null
          logo_url?: string | null
          social_email?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          updated_at?: string
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
      testimonials: {
        Row: {
          created_at: string
          display_order: number | null
          google_review_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          name: string
          rating: number | null
          source: string | null
          text: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          google_review_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          name: string
          rating?: number | null
          source?: string | null
          text: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          google_review_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string
          rating?: number | null
          source?: string | null
          text?: string
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
      [_ in never]: never
    }
    Functions: {
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
      payment_method: "cod" | "bkash" | "nagad"
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
      payment_method: ["cod", "bkash", "nagad"],
    },
  },
} as const
