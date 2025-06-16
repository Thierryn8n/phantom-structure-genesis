import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

/**
 * Verifica se um erro está relacionado com expiração de token JWT
 * @param error O erro a ser verificado
 * @returns true se o erro indicar JWT expirado
 */
export const isJwtExpiredError = (error: any): boolean => {
  if (!error) return false;
  
  // Para erros em formato de string
  if (typeof error === 'string') {
    return error.toLowerCase().includes('jwt expired') || 
           error.toLowerCase().includes('token expired') ||
           error.toLowerCase().includes('unauthorized');
  }
  
  // Para objetos de erro
  const errorString = JSON.stringify(error).toLowerCase();
  return errorString.includes('jwt expired') || 
         errorString.includes('token expired') ||
         errorString.includes('401') ||
         errorString.includes('403') ||
         errorString.includes('unauthorized');
};

/**
 * Tenta renovar a sessão atual do Supabase
 * @returns A nova sessão ou null em caso de erro
 */
export const refreshAuthSession = async (): Promise<Session | null> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Erro ao renovar a sessão:', error);
      return null;
    }
    
    console.log('Sessão renovada com sucesso em:', new Date().toISOString());
    return data.session;
  } catch (error) {
    console.error('Exceção ao tentar renovar a sessão:', error);
    return null;
  }
};

/**
 * Tenta executar uma operação e, em caso de erro de JWT expirado,
 * renova a sessão e tenta novamente.
 * 
 * @param operation A função que representa a operação a ser executada
 * @returns O resultado da operação ou null em caso de erro
 */
export const executeWithTokenRefresh = async <T>(operation: () => Promise<T>): Promise<T | null> => {
  try {
    // Primeira tentativa
    return await operation();
  } catch (error) {
    // Verifica se é erro de JWT expirado
    if (isJwtExpiredError(error)) {
      console.log('JWT expirado detectado, tentando renovar sessão...');
      
      // Tenta renovar a sessão
      const newSession = await refreshAuthSession();
      
      if (newSession) {
        try {
          // Nova tentativa após renovação
          return await operation();
        } catch (retryError) {
          console.error('Erro após renovação de sessão:', retryError);
          return null;
        }
      }
    }
    
    // Se não for erro de JWT ou a renovação falhar
    console.error('Erro na operação:', error);
    return null;
  }
};

/**
 * Força a renovação da sessão atual
 * @returns true se a renovação foi bem-sucedida, false caso contrário
 */
export const forceSessionRefresh = async (): Promise<boolean> => {
  const session = await refreshAuthSession();
  return session !== null;
}; 