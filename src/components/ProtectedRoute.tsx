import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, forceRefreshAuthContext } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [checkedAuthStatus, setCheckedAuthStatus] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // Se ainda está carregando a autenticação, aguarde
      if (loading) {
        return;
      }

      // Se já tem usuário, tudo certo
      if (user) {
        setIsChecking(false);
        setCheckedAuthStatus(true);
        return;
      }

      // Se não tem usuário e não estamos carregando, tentar forçar atualização do contexto
      if (!checkedAuthStatus) {
        console.log("ProtectedRoute: Primeira verificação, tentando forçar atualização do contexto...");
        
        try {
          // Tentar atualizar o contexto de autenticação
          const success = await forceRefreshAuthContext();
          
          if (!success) {
            console.log("ProtectedRoute: Não foi possível recuperar a sessão");
            // Marcar checagem como concluída e desativar loading para redirecionar imediatamente
            setCheckedAuthStatus(true);
            setIsChecking(false);
          }
        } catch (error) {
          console.error("ProtectedRoute: Erro ao verificar autenticação:", error);
          // Em caso de erro, também concluímos a checagem
          setCheckedAuthStatus(true);
          setIsChecking(false);
        }
      } else {
        // Se já verificamos e ainda não tem usuário, desativar loading
        setIsChecking(false);
      }
    };

    // Definir um tempo máximo para verificação (2 segundos)
    const timeoutId = setTimeout(() => {
      if (isChecking && !user) {
        console.log("ProtectedRoute: Tempo esgotado para verificação, redirecionando para login");
        setIsChecking(false);
        setCheckedAuthStatus(true);
      }
    }, 2000);

    checkAuth();

    // Limpar timeout
    return () => clearTimeout(timeoutId);
  }, [user, loading, checkedAuthStatus, forceRefreshAuthContext]);

  // Se ainda estamos carregando ou verificando, mostrar spinner
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-4" />
        <p className="text-gray-600">Verificando autenticação...</p>
      </div>
    );
  }

  // Se não tem usuário após verificação, redirecionar para login
  if (!user) {
    // Salvar o caminho atual para redirecionar de volta após o login
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    console.log("ProtectedRoute: Usuário não autenticado, redirecionando para login");
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  // Se tem usuário, renderizar a rota protegida
  return <>{children}</>;
};

export default ProtectedRoute; 