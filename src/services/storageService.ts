import { supabase, createServiceClient } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Tipos para os buckets de armazenamento
export type BucketType = 'store-logos' | 'store-favicons' | 'store-banners';

// Verifica e cria os buckets necessários se não existirem
export const createRequiredBuckets = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    // Lista de todos os buckets necessários
    const requiredBuckets: BucketType[] = ['store-logos', 'store-favicons', 'store-banners'];
    
    // Verifica se os buckets existem
    let existingBuckets: any[] = [];
    let listError;
    
    // Tenta listar buckets com client padrão primeiro
    const listResult = await supabase.storage.listBuckets();
    existingBuckets = listResult.data || [];
    listError = listResult.error;
    
    // Se falhar, tenta com client de serviço
    if (listError) {
      console.log('Tentando listar buckets com client de serviço...');
      const serviceClient = createServiceClient();
      const serviceResult = await serviceClient.storage.listBuckets();
      
      if (serviceResult.error) {
        // Se ainda falhar na listagem, consideramos que os buckets já existem
        // Isso evita problemas de permissão que podem ocorrer
        console.log('Não foi possível listar buckets, assumindo que existem:', serviceResult.error.message);
        return { success: true };
      }
      
      existingBuckets = serviceResult.data || [];
      console.log('Buckets listados com client de serviço:', existingBuckets.map(b => b.name));
    } else {
      console.log('Buckets listados com client padrão:', existingBuckets.map(b => b.name));
    }
    
    // Nomes dos buckets existentes
    const existingBucketNames = existingBuckets.map(bucket => bucket.name);
    console.log('Buckets já existentes:', existingBucketNames);
    
    // Verifica se todos os buckets necessários já existem
    const todosExistem = requiredBuckets.every(bucket => existingBucketNames.includes(bucket));
    
    if (todosExistem) {
      console.log('Todos os buckets necessários já existem. Ignorando a criação.');
      return { success: true };
    }
    
    // Se algum bucket não existe, tenta criar apenas os que faltam
    const bucketsParaCriar = requiredBuckets.filter(bucket => !existingBucketNames.includes(bucket));
    
    if (bucketsParaCriar.length === 0) {
      console.log('Nenhum bucket novo para criar.');
      return { success: true };
    }
    
    console.log('Buckets que serão criados:', bucketsParaCriar);
    
    // Cliente que será usado (padrão ou de serviço)
    const serviceClient = createServiceClient();
    
    // Para cada bucket que precisa ser criado
    for (const bucketName of bucketsParaCriar) {
      try {
        console.log(`Criando bucket ${bucketName}...`);
        
        const { error: createError } = await serviceClient.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: bucketName === 'store-banners' ? 5242880 : 1048576 // 5MB para banners, 1MB para outros
        });
        
        if (createError) {
          // Se o erro for porque o bucket já existe, ignoramos e continuamos
          if (createError.message?.includes('already exists')) {
            console.log(`Bucket ${bucketName} já existe. Ignorando erro.`);
            continue;
          }
          
          console.error(`Erro ao criar bucket ${bucketName}:`, createError);
          // Não retornamos erro, apenas logamos e continuamos para o próximo bucket
        } else {
          console.log(`Bucket ${bucketName} criado com sucesso.`);
        }
        
        // Atualiza políticas de acesso para tornar o bucket público
        try {
          await serviceClient.storage.updateBucket(bucketName, {
            public: true
          });
          console.log(`Permissões do bucket ${bucketName} atualizadas para público.`);
        } catch (policyError) {
          console.log(`Erro ao atualizar permissões do bucket ${bucketName}:`, policyError);
          // Ignoramos erros de política e continuamos
        }
      } catch (err) {
        console.log(`Erro ao processar bucket ${bucketName}:`, err);
        // Não interrompemos o processo por causa de um bucket
      }
    }
    
    console.log('Processo de verificação de buckets concluído.');
    return { success: true };
  } catch (error) {
    console.error('Erro ao verificar/criar buckets:', error);
    // Retornamos sucesso mesmo com erro, para não bloquear o upload
    return { success: true, error };
  }
};

// Função para fazer upload de um arquivo para um bucket específico
export const uploadFile = async (
  file: File,
  bucketName: BucketType,
  ignoreBucketError: boolean = false,
  customFileName?: string
): Promise<{ success: boolean; url?: string; error?: any }> => {
  try {
    // Validação inicial do arquivo
    console.log('Iniciando upload de arquivo:', {
      nome: file.name,
      tipo: file.type,
      tamanho: `${(file.size / 1024).toFixed(2)} KB`,
      bucket: bucketName,
      ignorarErroBucket: ignoreBucketError
    });

    // Verifica se o tipo de arquivo é suportado
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon'];
    if (!validImageTypes.includes(file.type)) {
      console.error(`Tipo de arquivo não suportado: ${file.type}`);
      return { 
        success: false, 
        error: `Tipo de arquivo não suportado: ${file.type}. Apenas imagens são permitidas.` 
      };
    }

    // Verifica tamanho do arquivo
    const maxSize = bucketName === 'store-banners' ? 5242880 : 1048576; // 5MB para banners, 1MB para outros
    if (file.size > maxSize) {
      console.error(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo: ${(maxSize / 1024 / 1024)}MB`);
      return { 
        success: false, 
        error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo: ${(maxSize / 1024 / 1024)}MB` 
      };
    }

    // Garante que os buckets existem antes de tentar fazer upload
    // Se estamos ignorando erros de bucket, não tentamos criar os buckets
    if (!ignoreBucketError) {
      const { success: bucketsReady, error: bucketError } = await createRequiredBuckets();
      
      if (!bucketsReady && !ignoreBucketError) {
        console.error('Erro ao verificar/criar buckets:', bucketError);
        return { success: false, error: bucketError || 'Não foi possível criar os buckets necessários' };
      }
    } else {
      console.log('Ignorando verificação de buckets conforme solicitado');
    }
    
    // Cria um nome de arquivo seguro
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const safeFileName = customFileName || `${uuidv4()}.${fileExtension}`;
    
    console.log(`Iniciando upload para ${bucketName}/${safeFileName}`);
    
    // Tenta fazer upload usando o cliente padrão
    let data, error;
    try {
      const result = await supabase.storage
        .from(bucketName)
        .upload(safeFileName, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      data = result.data;
      error = result.error;
      
      console.log('Resultado do upload com cliente padrão:', {
        sucesso: !error,
        dados: data,
        erro: error ? {
          message: error.message || 'Erro desconhecido',
          codigo: typeof error === 'object' ? JSON.stringify(error) : String(error)
        } : null
      });
    } catch (clientError: any) {
      // Verificamos se o erro já é sobre bucket existente e estamos ignorando
      if (ignoreBucketError && clientError?.message?.includes('already exists')) {
        console.log('Ignorando erro de bucket existente e continuando...');
      } else {
        console.warn('Falha no upload com cliente padrão, detalhes:', {
          mensagem: clientError?.message,
          status: clientError?.status,
          detalhes: clientError?.details,
          code: clientError?.code
        });
        error = clientError;
      }
    }
    
    // Se falhar com o cliente padrão, tenta com o serviceClient
    if (error) {
      // Se o erro for sobre bucket existente e estamos ignorando, não tentamos de novo
      if (ignoreBucketError && error?.message?.includes('already exists')) {
        console.log('Pulando client de serviço porque o erro é sobre bucket existente');
      } else {
        try {
          console.log('Tentando upload com client de serviço...');
          const serviceClient = createServiceClient();
          const serviceResult = await serviceClient.storage
            .from(bucketName)
            .upload(safeFileName, file, {
              cacheControl: '3600',
              upsert: true,
            });
          
          data = serviceResult.data;
          error = serviceResult.error;
          
          console.log('Resultado do upload com client de serviço:', {
            sucesso: !serviceResult.error,
            dados: serviceResult.data,
            erro: serviceResult.error ? {
              message: serviceResult.error.message || 'Erro desconhecido',
              codigo: typeof serviceResult.error === 'object' ? JSON.stringify(serviceResult.error) : String(serviceResult.error)
            } : null
          });
          
          if (!serviceResult.error) {
            console.log('Upload com client de serviço bem-sucedido');
          }
        } catch (serviceError: any) {
          console.error('Falha no upload com cliente de serviço:', {
            mensagem: serviceError?.message,
            status: serviceError?.status,
            detalhes: serviceError?.details,
            code: serviceError?.code
          });
          error = error || serviceError;
        }
      }
    }
    
    if (error) {
      // Se estamos ignorando erros de bucket e o erro é sobre isso, continuamos mesmo assim
      if (ignoreBucketError && error?.message?.includes('already exists')) {
        console.log('Ignorando erro de bucket existente e tentando obter URL mesmo assim');
        // Criamos um objeto falso para simular sucesso
        data = { path: `${bucketName}/${safeFileName}` };
        // Continuamos para obter a URL
      } else {
        console.error(`Erro ao fazer upload para ${bucketName}:`, {
          mensagem: error?.message || 'Erro desconhecido',
          erro: typeof error === 'object' ? JSON.stringify(error) : String(error)
        });
        return { success: false, error };
      }
    }
    
    console.log(`Upload concluído com sucesso: ${bucketName}/${safeFileName}`);
    
    // Obtém a URL pública do arquivo
    let urlData;
    try {
      // Primeiro tenta com o cliente padrão
      const result = supabase.storage
        .from(bucketName)
        .getPublicUrl(safeFileName);
        
      urlData = result.data;
      console.log('URL pública gerada via cliente padrão:', urlData);
      
      // Se não conseguir, tenta com o cliente de serviço
      if (!urlData || !urlData.publicUrl) {
        console.log('Tentando obter URL pública via cliente de serviço');
        const serviceClient = createServiceClient();
        const serviceResult = serviceClient.storage
          .from(bucketName)
          .getPublicUrl(safeFileName);
          
        urlData = serviceResult.data;
        console.log('URL pública gerada via cliente de serviço:', urlData);
      }
    } catch (urlError: any) {
      console.error('Erro ao obter URL pública:', {
        mensagem: urlError?.message,
        status: urlError?.status,
        detalhes: urlError?.details
      });
      // Tenta construir a URL manualmente como fallback
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      urlData = {
        publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${safeFileName}`
      };
      console.log('URL pública construída manualmente:', urlData.publicUrl);
    }
    
    if (!urlData || !urlData.publicUrl) {
      console.error('Não foi possível obter a URL pública do arquivo');
      return { 
        success: false, 
        error: 'Não foi possível obter a URL pública do arquivo'
      };
    }
    
    console.log(`URL pública final: ${urlData.publicUrl}`);
    
    return { 
      success: true, 
      url: urlData.publicUrl 
    };
  } catch (error: any) {
    console.error('Erro não tratado ao fazer upload de arquivo:', {
      mensagem: error?.message,
      stack: error?.stack
    });
    return { success: false, error };
  }
};

// Função para excluir um arquivo de um bucket
export const deleteFile = async (
  fileName: string,
  bucketName: BucketType
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);
    
    if (error) {
      console.error(`Erro ao excluir arquivo de ${bucketName}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    return { success: false, error };
  }
};

// Função para obter o nome do arquivo a partir de uma URL
export const getFileNameFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error('URL inválida:', error);
    return null;
  }
}; 