import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export function useSessionRefresh() {
  const { toast } = useToast();

  /**
   * Tenta renovar a sessão automaticamente
   * Primeiro tenta a renovação padrão, depois tenta recuperar do localStorage
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log("useSessionRefresh: Tentando renovar sessão");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("useSessionRefresh: Erro na renovação padrão:", error.message);
        
        // Tentar recuperação de emergência do token armazenado
        const storedToken = localStorage.getItem('supabase.auth.token');
        if (storedToken) {
          console.log("useSessionRefresh: Tentando recuperação via localStorage");
          try {
            const parsedToken = JSON.parse(storedToken);
            if (parsedToken.refresh_token) {
              const { data: recoveryData, error: recoveryError } = await supabase.auth.refreshSession({
                refresh_token: parsedToken.refresh_token
              });
              
              if (recoveryError) {
                console.error("useSessionRefresh: Falha na recuperação:", recoveryError);
              } else if (recoveryData.session) {
                console.log("useSessionRefresh: Sessão recuperada com sucesso via token armazenado");
                
                // Atualizar token no localStorage
                localStorage.setItem('supabase.auth.token', JSON.stringify({
                  access_token: recoveryData.session.access_token,
                  refresh_token: recoveryData.session.refresh_token
                }));
                
                toast({
                  title: "Sessão renovada",
                  description: "Sua sessão foi renovada automaticamente.",
                  variant: "success"
                });
                
                return true;
              }
            }
          } catch (parseError) {
            console.error("useSessionRefresh: Erro ao processar token armazenado:", parseError);
          }
        }
        
        // Se chegou aqui, todas as tentativas falharam
        toast({
          title: "Sessão expirada",
          description: "Não foi possível renovar sua sessão. Faça login novamente.",
          variant: "error"
        });
        
        return false;
      }
      
      if (data?.session) {
        console.log("useSessionRefresh: Sessão renovada com sucesso");
        
        // Atualizar token no localStorage
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }));
        
        toast({
          title: "Sessão renovada",
          description: "Sua sessão foi renovada automaticamente.",
          variant: "success"
        });
        
        return true;
      }
      
      // Se não há erros mas também não há sessão
      console.warn("useSessionRefresh: Não foi possível obter nova sessão");
      return false;
    } catch (error) {
      console.error("useSessionRefresh: Erro inesperado:", error);
      return false;
    }
  }, [toast]);

  /**
   * Verifica se a sessão está ativa e tenta renovar se necessário
   * @returns Informações da sessão e status da verificação
   */
  const checkActiveSession = useCallback(async () => {
    try {
      // Verificar sessão atual
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("useSessionRefresh: Erro ao verificar sessão:", error);
        return { 
          active: false, 
          renewed: false, 
          userId: null 
        };
      }
      
      if (!data.session) {
        console.warn("useSessionRefresh: Sessão não encontrada, tentando renovar");
        const renewed = await refreshSession();
        
        if (renewed) {
          // Buscar dados da nova sessão
          const { data: newData } = await supabase.auth.getSession();
          return { 
            active: true, 
            renewed: true, 
            userId: newData.session?.user.id || null 
          };
        }
        
        return { 
          active: false, 
          renewed: false, 
          userId: null 
        };
      }
      
      // Verificar se o token está prestes a expirar (menos de 5 minutos)
      const expiryTime = data.session.expires_at ? new Date(data.session.expires_at * 1000) : null;
      const now = new Date();
      const timeLeftMinutes = expiryTime ? (expiryTime.getTime() - now.getTime()) / 1000 / 60 : 0;
      
      if (expiryTime && timeLeftMinutes < 5) {
        console.warn(`useSessionRefresh: Token expira em ${timeLeftMinutes.toFixed(1)} minutos, renovando proativamente`);
        const renewed = await refreshSession();
        
        return { 
          active: true, 
          renewed, 
          userId: data.session.user.id,
          expiresAt: data.session.expires_at
        };
      }
      
      return { 
        active: true, 
        renewed: false, 
        userId: data.session.user.id,
        expiresAt: data.session.expires_at
      };
    } catch (error) {
      console.error("useSessionRefresh: Erro ao verificar sessão ativa:", error);
      return { 
        active: false, 
        renewed: false, 
        userId: null, 
        error 
      };
    }
  }, [refreshSession]);

  return {
    refreshSession,
    checkActiveSession
  };
} 