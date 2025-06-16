import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Obtém as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificações de segurança para evitar inicialização com valores inválidos
if (!supabaseUrl) {
  console.error('ERRO CRÍTICO: VITE_SUPABASE_URL não definido no .env');
}

if (!supabaseAnonKey) {
  console.error('ERRO CRÍTICO: VITE_SUPABASE_ANON_KEY não definido no .env');
}

// Opções específicas para o cliente público - minimiza persistência de sessão
const supabasePublicOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'fiscal-flow-public',
    },
  },
};

// Cria o cliente público com tipagem
export const supabasePublic = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  supabasePublicOptions
);

console.log('Cliente Supabase público inicializado para acesso anônimo');

// Função para obter produtos sem autenticação
export async function getPublicProducts(
  page: number = 1, 
  limit: number = 20, 
  searchTerm?: string,
  category_id?: string
) {
  try {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;
    
    let query = supabasePublic
      .from('products')
      .select('*', { count: 'exact' });
    
    // Configurar range para paginação
    query = query.range(startIndex, endIndex);
    
    // Adicionar filtros se necessário
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
    }
    
    if (category_id) {
      query = query.eq('category_id', category_id);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar produtos públicos:', error);
      return { data: [], count: 0 };
    }
    
    return { 
      data, 
      count: count || 0 
    };
  } catch (error) {
    console.error('Erro ao buscar produtos públicos:', error);
    return { data: [], count: 0 };
  }
}

// Função para obter categorias sem autenticação
export async function getPublicCategories() {
  try {
    const { data, error } = await supabasePublic
      .from('ecommerce_categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Erro ao buscar categorias públicas:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar categorias públicas:', error);
    return [];
  }
}

// Função para obter configurações da loja sem autenticação
export async function getPublicStoreSettings(ownerId?: string) {
  try {
    let query = supabasePublic
      .from('ecommerce_settings')
      .select('*')
      .limit(1);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query.single();
    
    if (error) {
      console.error('Erro ao buscar configurações públicas da loja:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar configurações públicas da loja:', error);
    return null;
  }
}

export default {
  supabasePublic,
  getPublicProducts,
  getPublicCategories,
  getPublicStoreSettings
}; 