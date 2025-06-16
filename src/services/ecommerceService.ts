import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { supabasePublic, getPublicProducts, getPublicCategories, getPublicStoreSettings } from '@/integrations/supabase/publicClient';
import type { Database } from '@/integrations/supabase/types';

/**
 * IMPORTANTE: Páginas públicas como Ecommerce, Carrinho e Checkout NÃO requerem autenticação.
 * 
 * Para corrigir os erros 401 (Unauthorized) que estão ocorrendo com as tabelas do ecommerce,
 * é necessário configurar as políticas de segurança (RLS - Row Level Security) do Supabase.
 * 
 * Acesse o Supabase Dashboard em: https://app.supabase.com
 * Vá para: Database > Tables > (selecione a tabela) > Policies
 * 
 * Para cada tabela pública (products, ecommerce_categories, ecommerce_settings), adicione uma policy:
 * - Nome da policy: "Enable read access for all users"
 * - Operação: SELECT
 * - Target roles: authenticated, anon
 * - Using expression: true
 * 
 * Isso permitirá que usuários não autenticados acessem os dados dessas tabelas.
 */

export interface EcommerceProduct {
  id: string;
  name: string;
  code: string;
  price: number;
  description?: string;
  imageUrl?: string;
  ncm?: string;
  unit?: string;
  quantity?: number;
  stock?: number;
  inStock?: boolean; // Facilita verificações de UI
  category?: string;
  category_id?: string;
  slug?: string;
}

export interface Category extends Omit<Database['public']['Tables']['ecommerce_categories']['Row'], 'created_at' | 'updated_at' | 'owner_id' | 'image_url'> {
  createdAt?: string;
  updatedAt?: string;
  icon?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  unit?: string;
  subtotal: number;
}

export interface StoreInfo {
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
  paymentMethods?: string[];
  shippingMethods?: {
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
  cachedAt?: string;
}

// Interface para Avaliações de Produto
export interface ProductReview {
  id: string;
  product_id: string;
  user_id?: string | null;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

// Interface para Vendedores
export interface Seller {
  id: string;
  owner_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  active?: boolean | null;
  image_path?: string | null; // Adicionado para a imagem do vendedor
  // outros campos da tabela sellers podem ser adicionados aqui se necessário
}

// Interface para Clientes (baseado na migração 20230603000000_create_customers_table.sql)
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string; // CEP
  } | null;
  signature?: string | null;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface NewCustomerData {
  name: string;
  phone: string;
  email?: string;
  address: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string; // CEP
  };
  owner_id: string; // ID do proprietário da loja/contexto
}

// Interfaces para o sistema Kanban
export type OrderStatus = 'entrada' | 'preparando' | 'saiu_para_entrega' | 'cancelado' | 'pendente';

export interface OrderKanban {
  id: string;
  product_id: string;
  product_name: string;
  customer_id: string;
  customer_name: string;
  seller_id: string;
  seller_name: string;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  total_amount?: number;
}

export interface NewOrderKanbanData {
  product_id: string;
  product_name: string;
  customer_id: string;
  customer_name: string;
  seller_id: string;
  seller_name: string;
  status: OrderStatus;
  notes?: string;
  total_amount?: number;
}

// Nova interface para os dados da Visão Geral do Dashboard
export interface DashboardOverviewData {
  totalRevenue: number;
  revenueToday: number;
  revenueYesterday: number;
  pendingOrdersCount: number;
  newEntriesCount: number;
  totalActiveProducts: number;
  newCustomersToday: number;
  recentOrders: Pick<OrderKanban, 'id' | 'customer_name' | 'created_at' | 'status' | 'product_name' | 'total_amount'>[];
  salesLast7Days: { name: string; sales: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
}

type PublicProductsReturnType = Awaited<ReturnType<typeof getPublicProducts>>;
type PublicCategoriesReturnType = Awaited<ReturnType<typeof getPublicCategories>>;
type PublicStoreSettingsReturnType = Awaited<ReturnType<typeof getPublicStoreSettings>>;

type EcommerceCategoriesTableRow = Database['public']['Tables']['ecommerce_categories']['Row'];
type EcommerceSettingsTableRow = Database['public']['Tables']['ecommerce_settings']['Row'];

export class EcommerceService {
  private static readonly PRODUCTS_TABLE = 'products';
  private static readonly REVIEWS_TABLE = 'product_reviews';
  private static readonly CART_STORAGE_KEY = 'fiscal_flow_cart';
  private static readonly STORE_INFO_STORAGE_KEY = 'fiscal_flow_store_info';
  private static readonly PRODUCTS_CACHE_KEY = 'fiscal_flow_products_cache';
  private static readonly PRODUCTS_TIMESTAMP_KEY = 'fiscal_flow_products_timestamp';
  private static readonly CACHE_EXPIRY = 5 * 60 * 1000;
  private static readonly SELLERS_TABLE = 'sellers';
  private static readonly CUSTOMERS_TABLE = 'customers';
  private static readonly ORDERS_KANBAN_TABLE = 'orders_kanban';
  
  // Produtos
  static async getProducts(
    page: number = 1, 
    limit: number = 20, 
    searchTerm?: string,
    category_id?: string,
    owner_id?: string
  ): Promise<{ data: EcommerceProduct[], count: number }> {
    return getPublicProducts(page, limit, searchTerm, category_id);
  }
  
  static async getProductById(id: string): Promise<EcommerceProduct | null> {
    try {
      const { data, error } = await supabasePublic
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar produto:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  }
  
  // Cache para categorias
  private static categoriesCache: Category[] | null = null;
  private static categoriesCacheTimestamp: number = 0;

  // Obter categorias com cache
  static async getCategories(): Promise<Category[]> {
    return getPublicCategories();
  }
  
  static async createCategory(category: { name: string; description?: string; icon?: string }): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('ecommerce_categories')
        .insert([
          {
        name: category.name,
        description: category.description,
            icon: category.icon || 'Package2'
          }
        ])
        .select()
        .single();
      
      if (error) throw error;

      return data ? {
        ...data,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } : null;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, categoryUpdate: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('ecommerce_categories')
        .update({
          name: categoryUpdate.name,
          description: categoryUpdate.description,
          icon: categoryUpdate.icon
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      return data ? {
        ...data,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } : null;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }

  static async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ecommerce_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalida o cache
      this.categoriesCache = null;
      this.categoriesCacheTimestamp = 0;
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      return false;
    }
  }
  
  static async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.PRODUCTS_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir produto:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      return false;
    }
  }
  
  // Carrinho de compras
  static getCart(): CartItem[] {
    try {
      const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
      if (cartData) {
        return JSON.parse(cartData);
      }
      return [];
    } catch (error) {
      console.error('Erro ao obter carrinho:', error);
      return [];
    }
  }
  
  static saveCart(cart: CartItem[]): void {
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  }
  
  static addToCart(product: EcommerceProduct, quantity: number = 1): CartItem[] {
    try {
      const cart = this.getCart();
      
      // Verificar se o produto já está no carrinho
      const existingItemIndex = cart.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // Atualizar quantidade se já existe
        cart[existingItemIndex].quantity += quantity;
        cart[existingItemIndex].subtotal = cart[existingItemIndex].price * cart[existingItemIndex].quantity;
      } else {
        // Adicionar novo item
        const newItem: CartItem = {
          id: uuidv4(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          imageUrl: product.imageUrl,
          unit: product.unit,
          subtotal: product.price * quantity
        };
        
        cart.push(newItem);
      }
      
      // Salvar carrinho atualizado
      this.saveCart(cart);
      return cart;
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      return this.getCart();
    }
  }
  
  static updateCartItemQuantity(itemId: string, quantity: number): CartItem[] {
    try {
      const cart = this.getCart();
      
      const updatedCart = cart.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, quantity); // Mínimo 1
          return {
            ...item,
            quantity: newQuantity,
            subtotal: item.price * newQuantity
          };
        }
        return item;
      });
      
      this.saveCart(updatedCart);
      return updatedCart;
    } catch (error) {
      console.error('Erro ao atualizar quantidade no carrinho:', error);
      return this.getCart();
    }
  }
  
  static removeFromCart(itemId: string): CartItem[] {
    try {
      let cart = this.getCart();
      cart = cart.filter(item => item.id !== itemId);
      this.saveCart(cart);
      return cart;
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      return this.getCart();
    }
  }
  
  static clearCart(): void {
    localStorage.removeItem(this.CART_STORAGE_KEY);
  }
  
  static getCartTotal(): number {
    try {
      const cart = this.getCart();
      return cart.reduce((total, item) => total + item.subtotal, 0);
    } catch (error) {
      console.error('Erro ao calcular total do carrinho:', error);
      return 0;
    }
  }
  
  // Cache para informações da loja
  private static storeInfoCache: StoreInfo | null = null;
  private static storeInfoCacheTimestamp: number = 0;

  // Obter informações da loja com cache
  static async getStoreInfo(forceRefresh: boolean = false, ownerId?: string): Promise<StoreInfo> {
    return getPublicStoreSettings(ownerId);
  }
  
  // Funções auxiliares
  private static generateSlug(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/[^\w-]+/g, ''); // Remove caracteres não alfanuméricos exceto hífens
  }

  // Funções para Product Reviews
  static async getProductReviews(productId: string): Promise<ProductReview[]> {
    try {
      const { data, error } = await supabasePublic
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar avaliações:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  }

  static async addProductReview(reviewData: {
    product_id: string;
    user_id?: string;
    author_name: string;
    rating: number;
    comment: string;
  }): Promise<ProductReview> {
    try {
      const { data, error } = await supabasePublic
        .from('product_reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar avaliação:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao adicionar avaliação:', error);
      throw error;
    }
  }

  /**
   * Obtém os estilos de cartão de produto da tabela ecommerce_product_card_styles
   */
  static async getProductCardStyles(): Promise<any> {
    try {
      // Primeiro tentamos usar o cliente público
      const { data, error } = await supabase
        .from('ecommerce_product_card_styles')
        .select('*')
        .limit(1)
        .single();
      
      if (error) {
        console.error('Erro ao buscar estilos de cartão:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar estilos de cartão:', error);
      return null;
    }
  }

  // Buscar vendedores ativos
  static async getActiveSellers(ownerId: string): Promise<Seller[]> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('active', true)
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      return [];
    }
  }

  // Criar novo cliente (sem autenticação)
  static async createCustomer(customerData: NewCustomerData): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        throw error;
    }
  }

  // Criar pedido no Kanban (sem autenticação)
  static async createOrderKanban(orderData: NewOrderKanbanData): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('orders_kanban')
        .insert([{
          ...orderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao criar pedido no Kanban:', error);
      throw error;
    }
  }

  static async getOrdersKanban(userId: string): Promise<OrderKanban[]> {
    try {
      const { data, error } = await supabase
        .from('orders_kanban')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pedidos do Kanban:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos do Kanban:', error);
      return [];
    }
  }

  static async updateOrderKanbanStatus(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders_kanban')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Erro ao atualizar status do pedido:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      return false;
    }
  }

  static async getOrderKanbanById(orderId: string): Promise<OrderKanban | null> {
    try {
      const { data, error } = await supabase
        .from('orders_kanban')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Erro ao buscar detalhes do pedido:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      return null;
    }
  }

  // =============================================================================================
  // FUNÇÃO PARA BUSCAR DADOS DA VISÃO GERAL DO DASHBOARD
  // =============================================================================================
  static async getDashboardOverviewData(ownerId: string): Promise<DashboardOverviewData> {
    console.log("EcommerceService: Buscando dados 100% reais de todas as tabelas para o proprietário:", ownerId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      interface OrderProduct {
        product_name: string;
        total_amount: number;
        status: string;
      }

      const todayISOStart = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowISOStart = tomorrow.toISOString();

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayISOStart = yesterday.toISOString();

      // --- 1. Vendas de Hoje e Ontem (Pedidos não cancelados) ---
      const { data: todayOrdersData, error: todayOrdersError } = await supabase
        .from(this.ORDERS_KANBAN_TABLE)
        .select("total_amount")
        .eq('owner_id', ownerId) // Filtra por loja
        .gte('created_at', todayISOStart)
        .lt('created_at', tomorrowISOStart)
        .neq('status', 'cancelado');

      if (todayOrdersError) throw todayOrdersError;

      const { data: yesterdayOrdersData, error: yesterdayOrdersError } = await supabase
        .from(this.ORDERS_KANBAN_TABLE)
        .select("total_amount")
        .eq('owner_id', ownerId) // Filtra por loja
        .gte('created_at', yesterdayISOStart)
        .lt('created_at', todayISOStart)
        .neq('status', 'cancelado');

      if (yesterdayOrdersError) throw yesterdayOrdersError;

      const revenueToday = (todayOrdersData || [])
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const revenueYesterday = (yesterdayOrdersData || [])
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // --- 2. Pedidos Pendentes e Novas Entradas ---
      const { data: pendingOrdersData, error: pendingOrdersError } = await supabase
        .from(this.ORDERS_KANBAN_TABLE)
        .select("id, created_at, status")
        .eq('owner_id', ownerId) // Filtra por loja
        .in('status', ['entrada', 'pendente']);

      if (pendingOrdersError) throw pendingOrdersError;

      const pendingOrders = pendingOrdersData || [];
      const pendingOrdersCount = pendingOrders.length;
      const newEntriesCount = pendingOrders.filter(o => 
        o.status === 'entrada' && 
        new Date(o.created_at) >= today
      ).length;

      // --- 3. Total de Produtos Ativos ---
      const { count: activeProductsCount, error: productsError } = await supabase
        .from(this.PRODUCTS_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId) // Filtra por loja
        .eq('inStock', true)
        .gt('quantity', 0); // Adiciona verificação de quantidade

      if (productsError) throw productsError;
      const totalActiveProducts = activeProductsCount || 0;

      // --- 4. Novos Clientes Hoje ---
      const { count: newCustomersCount, error: customersError } = await supabase
        .from(this.CUSTOMERS_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId)
        .gte('created_at', todayISOStart)
        .lt('created_at', tomorrowISOStart);

      if (customersError) throw customersError;
      const newCustomersToday = newCustomersCount || 0;

      // --- 5. Pedidos Recentes (Últimos 5) ---
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from(this.ORDERS_KANBAN_TABLE)
        .select('id, customer_name, created_at, status, product_name, total_amount')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentOrdersError) throw recentOrdersError;

      // --- 6. Vendas dos Últimos 7 Dias (Dados Reais) ---
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const sevenDaysAgoISOStart = sevenDaysAgo.toISOString();

      const { data: last7DaysOrdersData, error: last7DaysError } = await supabase
        .from(this.ORDERS_KANBAN_TABLE)
        .select("created_at, total_amount")
        .eq('owner_id', ownerId) // Filtra por loja
        .gte('created_at', sevenDaysAgoISOStart)
        .lt('created_at', tomorrowISOStart)
        .neq('status', 'cancelado');

      if (last7DaysError) throw last7DaysError;

      const salesLast7Days = Array(7).fill(null).map((_, i) => {
        const day = new Date(today);
        day.setDate(today.getDate() - (6 - i));
        day.setHours(0, 0, 0, 0);
        const nextDay = new Date(day);
        nextDay.setDate(day.getDate() + 1);

        const salesOnDay = (last7DaysOrdersData || [])
          .filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate >= day && orderDate < nextDay;
          })
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        return {
          name: day.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0,3).replace('.',''),
          sales: salesOnDay
        };
      });

      // --- 7. Top Produtos (Dados Reais - Últimos 30 dias) ---
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const { data: topProductsData, error: topProductsError } = await supabase
        .from(this.ORDERS_KANBAN_TABLE)
        .select('product_name, total_amount, status')
        .eq('owner_id', ownerId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .neq('status', 'cancelado');

      if (topProductsError) throw topProductsError;

      const productStats = ((topProductsData || []) as OrderProduct[]).reduce((acc, order) => {
        const productName = order.product_name;
        if (!acc[productName]) {
          acc[productName] = { name: productName, sales: 0, revenue: 0 };
        }
        acc[productName].sales += 1;
        acc[productName].revenue += order.total_amount || 0;
        return acc;
      }, {} as Record<string, { name: string; sales: number; revenue: number }>);

      const topProducts = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      // --- 8. Receita Total (Últimos 30 dias) ---
      const totalRevenue = ((topProductsData || []) as OrderProduct[])
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      return {
        totalRevenue,
        revenueToday,
        revenueYesterday,
        pendingOrdersCount,
        newEntriesCount,
        totalActiveProducts,
        newCustomersToday,
        recentOrders: recentOrdersData || [],
        salesLast7Days,
        topProducts,
      };

    } catch (error) {
      console.error("Falha crítica ao buscar dados da visão geral do dashboard:", error);
      // Em caso de falha crítica, retornamos zeros para não quebrar a UI
      const errorDate = new Date();
      const emptyDashboardData: DashboardOverviewData = {
        totalRevenue: 0,
        revenueToday: 0,
        revenueYesterday: 0,
        pendingOrdersCount: 0,
        newEntriesCount: 0,
        totalActiveProducts: 0,
        newCustomersToday: 0,
        recentOrders: [],
        salesLast7Days: Array(7).fill(null).map((_, i) => ({
          name: new Date(errorDate.setDate(errorDate.getDate() - (6 - i)))
            .toLocaleDateString('pt-BR', { weekday: 'short' })
            .substring(0,3)
            .replace('.',''),
          sales: 0
        })),
        topProducts: []
      };
      return emptyDashboardData;
    }
  }
  // =============================================================================================
} 