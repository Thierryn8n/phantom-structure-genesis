export type Database = {
  public: {
    Tables: {
      ecommerce_categories: {
        Row: {
          id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          owner_id?: string;
          image_url?: string | null;
          icon?: string | null;
        };
      };
      ecommerce_settings: {
        Row: {
          id: string;
          name: string;
          store_name?: string;
          logo?: string;
          logo_url?: string;
          description?: string;
          address?: string;
          phone?: string;
          email?: string;
          banner_image_url?: string;
          use_overlay_text?: boolean;
          font_family?: string;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          background_color?: string;
          header_background_color?: string;
          footer_background_color?: string;
          button_style?: string;
          border_radius?: number;
          favicon_url?: string;
          product_cards_per_row?: number;
          show_product_ratings?: boolean;
          show_discount_badge?: boolean;
          display_product_quick_view?: boolean;
          enable_wishlist?: boolean;
          show_social_share_buttons?: boolean;
          meta_keywords?: string;
          payment_methods?: string[];
          shipping_methods?: {
            id: string;
            name: string;
            price: number;
            description?: string;
          }[];
          footer_social_facebook?: string;
          footer_social_instagram?: string;
          footer_social_twitter?: string;
          footer_social_linkedin?: string;
          footer_social_youtube?: string;
          created_at?: string;
          updated_at?: string;
          owner_id?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          code: string;
          price: number;
          description?: string;
          image_path?: string;
          imageUrl?: string;
          ncm?: string;
          unit?: string;
          quantity?: number;
          inStock?: boolean;
          category?: string;
          category_id?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
          slug?: string;
          additional_images?: string[];
          stock?: number;
        };
      };
      orders_kanban: {
        Row: {
          id: string;
          product_id: string;
          product_name: string;
          customer_id: string;
          customer_name: string;
          seller_id: string;
          seller_name: string;
          status: string;
          notes?: string;
          created_at: string;
          updated_at: string;
          total_amount?: number;
          owner_id: string;
        };
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id?: string | null;
          author_name: string;
          rating: number;
          comment: string;
          created_at: string;
          updated_at: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: any;
          signature?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}; 