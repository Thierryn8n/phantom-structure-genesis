-- Script para gerar as definições de tipos para o Supabase
-- Este script exibe as definições de tipos que devem ser adicionadas ao arquivo types.ts do Supabase

/*
Instruções:
1. Execute este script no SQL Editor do Supabase
2. Copie a saída
3. Adicione as definições de tipo ao arquivo src/integrations/supabase/types.ts dentro do namespace Database
*/

-- Tabelas necessárias para e-commerce
SELECT '
// Definições das tabelas de e-commerce a serem adicionadas ao arquivo types.ts

export interface Database {
  public: {
    Tables: {
      // ... outras tabelas existentes ...
      
      // Tabela de categorias do e-commerce
      ecommerce_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      
      // Tabela de configurações do e-commerce
      ecommerce_settings: {
        Row: {
          id: number
          primary_color: string | null
          secondary_color: string | null
          accent_color: string | null
          background_color: string | null
          header_background_color: string | null
          footer_background_color: string | null
          font_family: string | null
          button_style: string | null
          border_radius: number | null
          logo_url: string | null
          logo_width: number | null
          favicon_url: string | null
          banner_image_url: string | null
          use_overlay_text: boolean | null
          product_cards_per_row: number | null
          show_product_ratings: boolean | null
          show_discount_badge: boolean | null
          display_product_quick_view: boolean | null
          enable_wishlist: boolean | null
          show_social_share_buttons: boolean | null
          store_name: string | null
          store_description: string | null
          meta_keywords: string | null
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          primary_color?: string | null
          secondary_color?: string | null
          accent_color?: string | null
          background_color?: string | null
          header_background_color?: string | null
          footer_background_color?: string | null
          font_family?: string | null
          button_style?: string | null
          border_radius?: number | null
          logo_url?: string | null
          logo_width?: number | null
          favicon_url?: string | null
          banner_image_url?: string | null
          use_overlay_text?: boolean | null
          product_cards_per_row?: number | null
          show_product_ratings?: boolean | null
          show_discount_badge?: boolean | null
          display_product_quick_view?: boolean | null
          enable_wishlist?: boolean | null
          show_social_share_buttons?: boolean | null
          store_name?: string | null
          store_description?: string | null
          meta_keywords?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          primary_color?: string | null
          secondary_color?: string | null
          accent_color?: string | null
          background_color?: string | null
          header_background_color?: string | null
          footer_background_color?: string | null
          font_family?: string | null
          button_style?: string | null
          border_radius?: number | null
          logo_url?: string | null
          logo_width?: number | null
          favicon_url?: string | null
          banner_image_url?: string | null
          use_overlay_text?: boolean | null
          product_cards_per_row?: number | null
          show_product_ratings?: boolean | null
          show_discount_badge?: boolean | null
          display_product_quick_view?: boolean | null
          enable_wishlist?: boolean | null
          show_social_share_buttons?: boolean | null
          store_name?: string | null
          store_description?: string | null
          meta_keywords?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_settings_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      
      // ... outras tabelas existentes ...
    }
    
    // ... Views, Functions, Enums, etc.
  }
}
';

-- Como adicionar as definições no arquivo types.ts existente
SELECT '
/* 
INSTRUÇÕES:

1. Copie as definições acima
2. Localize o arquivo src/integrations/supabase/types.ts
3. Procure pela interface Database e mergear as novas tabelas com o schema existente
4. Se as tabelas ecommerce_categories e ecommerce_settings já existirem, atualize suas definições
5. Mantenha todas as outras tabelas e tipos existentes
*/
';

-- Gerar exemplos de como usar os tipos atualizados
SELECT '
/* 
EXEMPLOS DE USO:

// Em um componente ou serviço
import { supabasePublic } from "./src/integrations/supabase/publicClient";

// Usando as definições de tipo para produtos
const getProducts = async () => {
  const { data, error } = await supabasePublic
    .from("products")
    .select("*");
    
  return data;
}

// Usando as definições de tipo para categorias do e-commerce
const getCategories = async () => {
  const { data, error } = await supabasePublic
    .from("ecommerce_categories")
    .select("*");
    
  return data;
}

// Usando as definições de tipo para configurações do e-commerce
const getSettings = async () => {
  const { data, error } = await supabasePublic
    .from("ecommerce_settings")
    .select("*")
    .limit(1)
    .single();
    
  return data;
}
*/
'; 