import { createClient } from '@supabase/supabase-js';
// Importar a instância principal do supabase client
import { supabase as mainSupabaseClient } from '../integrations/supabase/client';

// Obter as variáveis de ambiente
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''; // Removido - usaremos mainSupabaseClient
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''; // Removido - usaremos mainSupabaseClient
const siteUrl = window.location.origin; // URL base do site para redirecionamentos

// Verificação de depuração
// if (!supabaseUrl || !supabaseAnonKey) { // Removido
// console.error('Variáveis de ambiente do Supabase não configuradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
// }

// Usar a instância importada do cliente Supabase
export const supabase = mainSupabaseClient;

// Função auxiliar para diagnosticar problemas de autenticação e RLS
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
    // Tentar acessar a tabela de produtos com filtro de proprietário
    // IMPORTANTE: Usar owner_id (não user_id) para filtrar produtos - a tabela usa owner_id
    const { error: ownedError, count: ownedCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', sessionData.session.user.id);
    
    if (ownedError) {
      console.error('Erro ao acessar produtos do usuário:', ownedError);
      return { 
        autenticado: true, 
        acessoRLS: false, 
        erro: ownedError,
        userId: sessionData.session.user.id,
        tokenExpirado
      };
    }
    
    console.log('Acesso RLS com filtro de proprietário: OK');
    console.log('Contagem de produtos do usuário:', ownedCount);
    
    // Tentar acessar a tabela de produtos sem filtro (deve ser bloqueado pelo RLS)
    const { error: allError, count: allCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    console.log('Teste de restrição RLS (contagem geral):', allError ? `Bloqueado (erro: ${allError.message})` : `Contagem geral: ${allCount} (esperado bloqueio ou contagem limitada por RLS)`);
    
    return { 
      autenticado: true, 
      acessoRLS: !ownedError,
      userId: sessionData.session.user.id,
      tokenExpirado,
      resultados: {
        comFiltro: ownedCount,
        semFiltro: allCount
      },
      erro: ownedError
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

// Configurar eventos de autenticação para monitorar erros de token
// supabase.auth.onAuthStateChange((event, session) => { // Comentado pois já existe em integrations/supabase/client.ts
//   console.log(`Evento de autenticação (lib/supabaseClient): ${event} - ${new Date().toISOString()}`);
  
//   if (event === 'TOKEN_REFRESHED') {
//     console.log('Token renovado automaticamente (lib/supabaseClient):', new Date().toISOString());
//     console.log('Novo token válido até (lib/supabaseClient):', new Date(session?.expires_at ? session.expires_at * 1000 : 0).toISOString());
//     console.log('ID do usuário no token (lib/supabaseClient):', session?.user?.id);
//   } else if (event === 'SIGNED_OUT') {
//     console.log('Usuário deslogado (lib/supabaseClient):', new Date().toISOString());
//   } else if (event === 'PASSWORD_RECOVERY') {
//     console.log('Solicitação de recuperação de senha processada (lib/supabaseClient):', new Date().toISOString());
//     if (session?.user) {
//       console.log('- Usuário (lib/supabaseClient):', session.user.email);
//     }
//   } else if (event === 'USER_UPDATED') {
//     console.log('Dados do usuário atualizados (lib/supabaseClient):', new Date().toISOString());
//     if (session?.user) {
//       console.log('- Usuário (lib/supabaseClient):', session.user.email);
//     }
//   } else if (event === 'SIGNED_IN') {
//     console.log('Usuário logado (lib/supabaseClient):', new Date().toISOString());
//     if (session?.user) {
//       console.log('- Email (lib/supabaseClient):', session.user.email);
//       console.log('- ID (lib/supabaseClient):', session.user.id);
//       console.log('- Role (lib/supabaseClient):', session.user?.app_metadata?.role || 'Não definido');
//       console.log('- Token expira em (lib/supabaseClient):', new Date(session.expires_at ? session.expires_at * 1000 : 0).toISOString());
//     }
//   } else if (event === 'INITIAL_SESSION') {
//     console.log('Sessão inicial carregada (lib/supabaseClient):', new Date().toISOString());
//     console.log('Sessão presente (lib/supabaseClient):', !!session);
//     if (session) {
//       console.log('- ID do usuário (lib/supabaseClient):', session.user.id);
//       console.log('- Token JWT presente (lib/supabaseClient):', !!session.access_token);
//       console.log('- Token expira em (lib/supabaseClient):', new Date(session.expires_at ? session.expires_at * 1000 : 0).toISOString());
//       // Verificação de sanidade do token
//       const expiry = session.expires_at ? new Date(session.expires_at * 1000) : null;
//       const now = new Date();
//       if (expiry && expiry < now) {
//         console.error('ALERTA (lib/supabaseClient): Token JWT já expirado!', {
//           expiry: expiry.toISOString(),
//           now: now.toISOString(),
//           diff: (expiry.getTime() - now.getTime()) / 1000 / 60, // Diferença em minutos
//         });
//       }
//     }
//   }
// });

// Cliente Supabase com chave de serviço para ações administrativas
const supabaseUrlFromIntegrations = import.meta.env.VITE_SUPABASE_URL || ''; // Necessário para supabaseAdmin
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';
if (!supabaseServiceKey) {
  console.error('ERRO CRÍTICO: VITE_SUPABASE_SERVICE_KEY não definido no .env');
}

// Configurações globais para o cliente Admin
export const supabaseAdmin = createClient(supabaseUrlFromIntegrations, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false, // Não é necessário para cliente admin
    persistSession: false,   // Não é necessário para cliente admin
    // Definir o site URL como URL base para todos os e-mails
    // Isso será acrescentado a todos os links em e-mails enviados
    flowType: 'pkce', // Usar PKCE como método de autenticação
  },
  // Definir headers personalizados para requisições
  global: {
    headers: {
      'x-application-name': 'Fiscal Flow Admin'
    }
  }
});

console.log('Cliente Supabase Admin inicializado com URL base:', siteUrl);
