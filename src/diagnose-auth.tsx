import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DiagnoseAuth = () => {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [localStorageInfo, setLocalStorageInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { user, refreshSession, forceRefreshAuthContext } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAuthInfo();
  }, []);
  
  const fetchAuthInfo = async () => {
    setIsChecking(true);
    try {
      // Buscar informações da sessão atual
      const { data } = await supabase.auth.getSession();
      
      // Verificar localStorage
      const tokenData = localStorage.getItem('supabase.auth.token');
      let parsedToken = null;
      
      try {
        parsedToken = tokenData ? JSON.parse(tokenData) : null;
      } catch (error) {
        parsedToken = { error: 'Token corrompido', raw: tokenData };
      }
      
      setSessionInfo(data);
      setLocalStorageInfo(parsedToken);
    } catch (error) {
      console.error('Erro ao diagnosticar autenticação:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClearAuth = () => {
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    fetchAuthInfo();
  };

  const handleRefreshSession = async () => {
    setIsChecking(true);
    await refreshSession();
    fetchAuthInfo();
    setIsChecking(false);
  };

  const handleForceRefresh = async () => {
    setIsChecking(true);
    await forceRefreshAuthContext();
    fetchAuthInfo();
    setIsChecking(false);
  };

  const formatExpiry = (expiryTimestamp: number) => {
    if (!expiryTimestamp) return 'Não disponível';
    
    const expiryDate = new Date(expiryTimestamp * 1000);
    const now = new Date();
    
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 0) {
      return `Expirado há ${Math.abs(diffMins)} minutos (${expiryDate.toLocaleString()})`;
    } else {
      return `Expira em ${diffMins} minutos (${expiryDate.toLocaleString()})`;
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Autenticação</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status da Autenticação</CardTitle>
            <CardDescription>Informações sobre o estado atual da autenticação</CardDescription>
          </CardHeader>
          <CardContent>
      <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Usuário do Contexto de Autenticação:</h3>
                <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {user ? JSON.stringify(user, null, 2) : 'Nenhum usuário autenticado'}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Sessão Atual (supabase.auth.getSession):</h3>
                <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {isChecking 
                    ? 'Verificando...' 
                    : sessionInfo 
                      ? JSON.stringify(sessionInfo, null, 2) 
                      : 'Nenhuma sessão encontrada'
                  }
                </pre>
                {sessionInfo?.session && (
                  <p className="mt-2 text-sm">
                    <strong>Status da Expiração:</strong> {formatExpiry(sessionInfo.session.expires_at)}
                  </p>
                )}
        </div>
        
              <div>
                <h3 className="font-medium mb-2">Token no LocalStorage:</h3>
                <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {isChecking 
                    ? 'Verificando...' 
                    : localStorageInfo 
                      ? JSON.stringify(localStorageInfo, null, 2) 
                      : 'Nenhum token encontrado no localStorage'
                  }
                </pre>
          </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={fetchAuthInfo}
                disabled={isChecking}
                variant="outline"
              >
                Atualizar Informações
              </Button>
              <Button 
                onClick={handleClearAuth}
                disabled={isChecking}
                variant="destructive"
              >
                Limpar Dados de Autenticação
              </Button>
              <Button 
                onClick={handleRefreshSession}
                disabled={isChecking}
              >
                Renovar Sessão
              </Button>
              <Button 
                onClick={handleForceRefresh}
                disabled={isChecking}
                variant="secondary"
              >
                Forçar Atualização do Contexto
              </Button>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="mt-4"
              variant="default"
            >
              Ir para Login
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Solução de Problemas</CardTitle>
            <CardDescription>Passos para resolução de problemas comuns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Problema: Não consigo acessar páginas protegidas</h3>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>Clique em "Limpar Dados de Autenticação"</li>
                  <li>Vá para a página de login</li>
                  <li>Faça login novamente com suas credenciais</li>
                </ol>
          </div>
              
              <div>
                <h3 className="font-medium mb-2">Problema: Sou redirecionado para login repetidamente</h3>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>Verifique se o token expirou (veja "Status da Expiração" acima)</li>
                  <li>Tente clicar em "Renovar Sessão"</li>
                  <li>Se não funcionar, limpe os dados e faça login novamente</li>
                  <li>Verifique sua conexão com a internet</li>
                </ol>
                  </div>
              
              <div>
                <h3 className="font-medium mb-2">Problema: Erros 403 (Forbidden)</h3>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>Este é um indicativo de que seu token expirou ou está inválido</li>
                  <li>Tente "Renovar Sessão" ou "Forçar Atualização do Contexto"</li>
                  <li>Se não funcionar, limpe os dados e faça login novamente</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiagnoseAuth; 