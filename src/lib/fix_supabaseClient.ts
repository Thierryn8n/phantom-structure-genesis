import { supabase } from '@/integrations/supabase/client';

// Função auxiliar para diagnosticar problemas de autenticação e RLS
// Versão corrigida com consultas mais simples e melhor tratamento de erros
export const checkAuthAndRLS = async () => {
  console.log('=== Diagnóstico de Autenticação e RLS ===');
  
  // Verificar sessão atual
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Erro ao obter sessão:', sessionError);
    return { autenticado: false, erro: sessionError };
  }
  
  if (!sessionData.session) {
    console.log('Nenhuma sessão ativa encontrada');
    return { autenticado: false, erro: 'Sem sessão' };
  }
  
  console.log('Sessão ativa encontrada:');
  console.log('- ID do usuário:', sessionData.session.user.id);
  console.log('- Token JWT presente:', !!sessionData.session.access_token);
  
  // Verificar se o token está expirado
  const expiry = sessionData.session.expires_at ? new Date(sessionData.session.expires_at * 1000) : null;
  const now = new Date();
  const tokenExpirado = expiry && expiry < now;
  
  console.log('- Token expirado?', tokenExpirado);
  console.log('- Expiração:', expiry ? expiry.toISOString() : 'N/A');
  
  // Tentativa de acesso a uma tabela protegida por RLS
  console.log('Testando acesso RLS:');
  
  try {
    // Usar uma consulta simples para testar RLS - apenas buscar alguns registros
    const { data: ownedProducts, error: ownedError } = await supabase
      .from('products')
      .select('id, name')  // Selecionar apenas ID e nome para tornar a consulta leve
      .eq('owner_id', sessionData.session.user.id)
      .limit(5);  // Limitar a 5 registros para tornar a consulta mais rápida
    
    if (ownedError) {
      console.error('Erro ao acessar produtos do usuário:', ownedError);
      
      // Exibir detalhes do erro para depuração
      if (ownedError.message) console.error('Mensagem de erro:', ownedError.message);
      if (ownedError.code) console.error('Código de erro:', ownedError.code);
      if (ownedError.details) console.error('Detalhes do erro:', ownedError.details);
      if (ownedError.hint) console.error('Dica para correção:', ownedError.hint);
      
      // Tentar uma consulta alternativa para diagnóstico
      console.log('Tentando consulta alternativa para diagnóstico...');
      const { data: altData, error: altError } = await supabase
        .from('products')
        .select('count')
        .limit(1);
        
      if (altError) {
        console.error('Consulta alternativa também falhou:', altError);
      } else {
        console.log('Consulta alternativa funcionou, problema pode ser específico do filtro owner_id');
      }
      
      return { 
        autenticado: true, 
        acessoRLS: false, 
        erro: ownedError,
        userId: sessionData.session.user.id,
        tokenExpirado
      };
    }
    
    console.log('Acesso RLS com filtro de proprietário: OK');
    console.log('Produtos encontrados:', ownedProducts ? ownedProducts.length : 0);
    
    // Exibir os produtos encontrados para depuração
    if (ownedProducts && ownedProducts.length > 0) {
      console.log('Amostra de produtos:', ownedProducts.slice(0, 2));
    }
    
    return { 
      autenticado: true, 
      acessoRLS: true, 
      userId: sessionData.session.user.id,
      tokenExpirado,
      resultados: {
        produtosEncontrados: ownedProducts ? ownedProducts.length : 0
      }
    };
  } catch (error) {
    console.error('Erro durante teste de RLS:', error);
    return { 
      autenticado: true, 
      acessoRLS: false, 
      erro: error,
      userId: sessionData.session.user.id,
      tokenExpirado
    };
  }
}; 