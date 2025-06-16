import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';

// Páginas públicas que não precisam de autenticação
const PUBLIC_PAGES = [
  '/login',
  '/register',
  '/reset-password',
  '/',
  '/ecommerce',
  '/forgot-password',
  '/recover-password',
  '/diagnose-auth',
  '/ecommerce/auth',
  '/ecommerce/wishlist'
];

// Verifica se o caminho atual é uma página pública
const isPublicPathname = (pathname: string) => {
  return PUBLIC_PAGES.some(page => 
    pathname === page || 
    (page !== '/' && pathname.startsWith(page + '/'))
  );
};

const AuthChecker = () => {
  const { user, loading, forceRefreshAuthContext, refreshSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRecoveryUI, setShowRecoveryUI] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [verificationCount, setVerificationCount] = useState(0);
  const currentPath = location.pathname;
  
  // Verifica se a página atual é pública
  const isPublicPage = isPublicPathname(currentPath);

  // Função para tentar recuperar a sessão
  const handleRecoverSession = async () => {
    setIsRecovering(true);
    
    try {
      // Limpar qualquer estado de sessão anterior que possa estar corrompido
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('session_recovery_attempted');
      
      // Primeiro tentar renovar a sessão
      const refreshSuccess = await refreshSession();
      
      if (refreshSuccess) {
        toast({
          title: "Sessão recuperada",
          description: "Sua autenticação foi restaurada com sucesso.",
          variant: "success"
        });
        setShowRecoveryUI(false);
      } else {
        // Se a renovação falhar, tentar forçar atualização do contexto
        const forceSuccess = await forceRefreshAuthContext();
        
        if (forceSuccess) {
          toast({
            title: "Autenticação recuperada",
            description: "Conseguimos restaurar sua sessão.",
            variant: "success"
          });
          setShowRecoveryUI(false);
        } else {
          // Se tudo falhar, redirecionar para o login
          toast({
            title: "Falha na recuperação",
            description: "Não foi possível recuperar sua sessão. Você será redirecionado para o login.",
            variant: "error"
          });
          setTimeout(() => {
            navigate('/login?redirect=' + encodeURIComponent(currentPath));
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Erro ao tentar recuperar sessão:", error);
    } finally {
      setIsRecovering(false);
    }
  };

  useEffect(() => {
    // Não fazemos nada se estiver carregando ou se for uma página pública
    if (loading || isPublicPage) {
      return;
    }

    // Se não tiver usuário após o carregamento e não for página pública, verificamos
    if (!user) {
      console.log("AuthChecker: Usuário não autenticado em página protegida:", currentPath);
      
      // Incrementa contador de verificações
      setVerificationCount(prev => prev + 1);
      
      // Na primeira verificação, tentamos recuperar a sessão
      if (verificationCount === 0) {
        console.log("AuthChecker: Primeira verificação, tentando força atualização do contexto...");
        
        // Tentar forçar atualização do contexto de autenticação
        forceRefreshAuthContext().then(success => {
          if (!success && !isPublicPage) {
            console.log("AuthChecker: Falha na primeira tentativa de recuperação");
            // Mostrar UI de recuperação por apenas 3 segundos antes de redirecionar
            setShowRecoveryUI(true);
            setTimeout(() => {
              if (!user && !isPublicPage) {
                navigate('/login?redirect=' + encodeURIComponent(currentPath));
              }
            }, 3000);
          }
        });
      } 
      // Na segunda verificação, se ainda não tem usuário, redirecionamos para o login
      else if (verificationCount >= 1 && !showRecoveryUI) {
        console.log("AuthChecker: Segunda verificação, redirecionando para login");
        navigate('/login?redirect=' + encodeURIComponent(currentPath));
      }
    } else {
      // Se tem usuário, escondemos a UI de recuperação
      setShowRecoveryUI(false);
    }
  }, [user, loading, currentPath, isPublicPage, verificationCount]);

  // Não renderizar nada se estiver em uma página pública ou se tiver usuário
  if (isPublicPage || user || !showRecoveryUI) {
    return null;
  }

  // Renderizar UI de recuperação de sessão
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          Problema de Autenticação Detectado
        </h2>
        <p className="mb-4 text-gray-700">
          Parece que sua sessão expirou ou está corrompida. Podemos tentar recuperá-la automaticamente ou você será redirecionado para a tela de login em alguns segundos.
        </p>
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleRecoverSession} 
            disabled={isRecovering}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isRecovering ? "Recuperando sessão..." : "Recuperar Sessão Agora"}
          </Button>
          <Button 
            onClick={() => navigate('/login?redirect=' + encodeURIComponent(currentPath))} 
            variant="outline"
            className="border-gray-300"
          >
            Fazer Login Novamente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthChecker; 