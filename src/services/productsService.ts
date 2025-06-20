import { supabase } from '@/lib/supabaseClient';

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  description?: string;
  imageurl?: string;
  image_path?: string;
  ncm?: string;
  unit?: string;
  quantity?: number;
  total?: number;
  owner_id: string;
  category_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const ProductsService = {
  /**
   * Busca produtos de um usuário específico
   * @param userId ID do proprietário dos produtos
   * @param page Página atual (começando em 0)
   * @param pageSize Tamanho da página
   * @returns Lista de produtos e contagem total
   */
  async getUserProducts(userId: string, page = 0, pageSize?: number) {
    console.log(`[ProductsService] Iniciando getUserProducts para userId: ${userId}, página: ${page}, pageSize: ${pageSize || 'todos'}`);

    if (!userId) {
      console.error('[ProductsService] ERRO: userId não fornecido para getUserProducts.');
      throw new Error('userId é obrigatório para buscar produtos do usuário');
    }

    try {
      // Diagnóstico: contar total de produtos na tabela
      console.log('[ProductsService] Executando diagnóstico: contando total de produtos na tabela...');
      const { count: totalProductsInTable, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('[ProductsService] Erro ao contar produtos na tabela:', countError);
      } else {
        console.log(`[ProductsService] Total de produtos na tabela: ${totalProductsInTable}`);
      }
      
      // Buscar produtos com ou sem paginação baseado no pageSize
      console.log(`[ProductsService] Executando consulta para owner_id: ${userId}`);
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      
      // Aplicar paginação apenas se pageSize for especificado
      if (pageSize && pageSize > 0) {
        const startIndex = page * pageSize;
        query = query.range(startIndex, startIndex + pageSize - 1);
      }
      
      const { data, error, count } = await query;

      if (error) {
        console.error(`[ProductsService] Erro ao buscar produtos para owner_id ${userId}:`, error);
        // Verificar especificamente erros de RLS ou permissão
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
          console.error('[ProductsService] Detecção de erro de RLS. Verifique as políticas na tabela products para o usuário autenticado.');
        }
        throw error;
      }

      const productsFound = data || [];
      const totalMatchingProducts = count || 0;

      if (productsFound.length > 0) {
        console.log(`[ProductsService] Encontrados ${productsFound.length} produtos de ${totalMatchingProducts} no total para owner_id ${userId}.`);
      } else {
        console.log(`[ProductsService] Nenhum produto encontrado para owner_id ${userId}. Total correspondente: ${totalMatchingProducts}.`);
      }

      return {
        products: productsFound,
        count: totalMatchingProducts,
        hasMore: productsFound.length === pageSize && totalMatchingProducts > (page + 1) * pageSize
      };
    } catch (error) {
      console.error(`[ProductsService] Exceção em getUserProducts para owner_id ${userId}:`, error);
      // Garantir que o erro seja relançado para ser tratado pelo chamador
      if (error instanceof Error && error.message.includes('Session expired') ) {
         // Se o erro for de sessão expirada, podemos tentar um refresh aqui,
         // mas o cliente supabase já deve fazer isso automaticamente.
         // Se chegar aqui, pode ser um problema mais sério com a sessão.
         console.warn("[ProductsService] Capturada exceção de sessão expirada. O cliente Supabase deveria ter lidado com isso.");
      }
      throw error;
    }
  },
  
  /**
   * Adiciona um novo produto
   * @param product Dados do produto
   * @returns O produto criado
   */
  async addProduct(product: Omit<Product, 'id'>) {
    console.log('[ProductsService] Iniciando addProduct:', product);
    if (!product.owner_id) {
        console.error('[ProductsService] ERRO: owner_id não fornecido para addProduct.');
        // Idealmente, o owner_id deve ser pego da sessão do usuário autenticado aqui
        // ou verificado contra ela, mas por enquanto, vamos exigir que seja passado.
        throw new Error('owner_id é obrigatório para adicionar produto.');
    }
    // Aqui, poderíamos adicionar uma verificação para garantir que product.owner_id
    // corresponde ao ID do usuário autenticado atual, se necessário.
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session || session.user.id !== product.owner_id) {
    //   console.error('[ProductsService] Tentativa de adicionar produto para owner_id diferente do usuário logado.');
    //   throw new Error('Não autorizado');
    // }


    try {
      // Verificar campos essenciais
      if (!product.name || !product.code || product.price <= 0) { // owner_id já verificado
        console.error('[ProductsService] Campos obrigatórios faltando em addProduct:', { name: product.name, code: product.code, price: product.price });
        throw new Error('Campos obrigatórios: nome, código, preço.');
      }

      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) {
        console.error('[ProductsService] Erro ao adicionar produto:', error);
        throw error;
      }
      console.log('[ProductsService] Produto adicionado com sucesso:', data);
      return data;
    } catch (error) {
      console.error(`[ProductsService] Exceção em addProduct:`, error);
      throw error;
    }
  },
  
  /**
   * Atualiza um produto existente
   * @param id ID do produto
   * @param product Dados do produto
   * @returns O produto atualizado
   */
  async updateProduct(id: string, product: Partial<Product>) {
    console.log(`[ProductsService] Iniciando updateProduct para id: ${id}`, product);
    try {
      // Remover owner_id se estiver presente na atualização (não deve ser alterado)
      if ('owner_id' in product) {
        console.warn('[ProductsService] Tentativa de alterar owner_id ignorada durante atualização.');
        delete product.owner_id;
      }
      // Garantir que o objeto product não está vazio após remover owner_id
      if (Object.keys(product).length === 0) {
        console.warn('[ProductsService] updateProduct chamado sem dados para atualizar (após remover owner_id).');
        // Retornar o produto existente ou um erro, dependendo da lógica de negócios.
        // Por ora, vamos buscar e retornar o produto sem alterá-lo.
        return this.getProductById(id);
      }


      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro no serviço de produtos:', error);
      throw error;
    }
  },
  
  /**
   * Remove um produto
   * @param id ID do produto
   * @returns Sucesso da operação
   */
  async deleteProduct(id: string) {
    console.log(`[ProductsService] Iniciando deleteProduct para id: ${id}`);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir produto:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Erro no serviço de produtos:', error);
      throw error;
    }
  },
  
  /**
   * Busca um produto específico
   * @param id ID do produto
   * @returns O produto encontrado
   */
  async getProductById(id: string) {
    console.log(`[ProductsService] Iniciando getProductById para id: ${id}`);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar produto:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro no serviço de produtos:', error);
      throw error;
    }
  },
  
  /**
   * Busca produtos com filtro de texto
   * @param userId ID do proprietário dos produtos
   * @param searchTerm Termo de busca
   * @param page Página atual (começando em 0)
   * @param pageSize Tamanho da página
   * @returns Lista de produtos filtrados e contagem total
   */
  async searchUserProducts(userId: string, searchTerm: string, page = 0, pageSize = 20) {
    console.log(`[ProductsService] Iniciando searchUserProducts para userId: ${userId}, termo: "${searchTerm}", página: ${page}, pageSize: ${pageSize}`);

    if (!userId) {
      console.error('[ProductsService] ERRO: userId não fornecido para searchUserProducts.');
      throw new Error('userId é obrigatório para buscar produtos do usuário');
    }

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      
      // Aplicar filtro de busca se fornecido
      if (searchTerm && searchTerm.trim()) {
        const searchTermLower = searchTerm.toLowerCase();
        query = query.or(`name.ilike.%${searchTermLower}%,code.ilike.%${searchTermLower}%,ncm.ilike.%${searchTermLower}%,description.ilike.%${searchTermLower}%`);
      }
      
      // Aplicar paginação
      const startIndex = page * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);
      
      const { data, error, count } = await query;

      if (error) {
        console.error(`[ProductsService] Erro ao buscar produtos para owner_id ${userId}:`, error);
        throw error;
      }

      const productsFound = data || [];
      const totalMatchingProducts = count || 0;

      console.log(`[ProductsService] Encontrados ${productsFound.length} produtos de ${totalMatchingProducts} no total para busca "${searchTerm}"`);

      return {
        products: productsFound,
        count: totalMatchingProducts,
        hasMore: productsFound.length === pageSize && totalMatchingProducts > (page + 1) * pageSize
      };
    } catch (error) {
      console.error(`[ProductsService] Exceção em searchUserProducts:`, error);
      throw error;
    }
  },

  /**
   * Faz upload de uma imagem de produto
   * @param userId ID do usuário
   * @param file Arquivo de imagem
   * @returns URL pública da imagem
   */
  async uploadProductImage(userId: string, file: File) {
    console.log(`[ProductsService] Iniciando uploadProductImage para userId: ${userId}`, file.name);
    if (!userId) {
      console.error('[ProductsService] ERRO: userId não fornecido para uploadProductImage.');
      throw new Error('UserID é obrigatório para fazer upload de imagem.');
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        throw error;
      }
      
      // Gerar URL pública da imagem
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      console.log(`[ProductsService] Upload concluído. URL pública: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Erro no serviço de produtos:', error);
      throw error;
    }
  }
};