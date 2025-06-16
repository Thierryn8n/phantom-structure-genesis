import React from 'react';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

interface ErrorAlertProps {
  title: string;
  message: string;
  type?: 'jwt_expired' | 'auth_error' | 'general';
  onClose?: () => void;
  onRefresh?: () => void;
}

export function ErrorAlert({ 
  title, 
  message, 
  type = 'general', 
  onClose,
  onRefresh 
}: ErrorAlertProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Sessão encerrada',
        description: 'Você foi desconectado com sucesso.',
        variant: 'info',
      });
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro ao sair',
        description: 'Não foi possível encerrar a sessão corretamente.',
        variant: 'error',
      });
    }
  };

  return (
    <Card className="p-6 shadow-lg border-2 border-red-500 bg-red-50 rounded-xl max-w-lg mx-auto my-[10px]">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-900 mb-2">{title}</h3>
          <p className="text-red-800 mb-4">{message}</p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            {type === 'jwt_expired' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  className="border-red-500 text-red-700 hover:bg-red-100 flex gap-2 items-center"
                >
                  <RefreshCw size={16} />
                  Atualizar Página
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white flex gap-2 items-center"
                >
                  <LogOut size={16} />
                  Fazer Login Novamente
                </Button>
              </>
            )}
            
            {type === 'auth_error' && (
              <Button 
                variant="default" 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white flex gap-2 items-center"
              >
                <LogOut size={16} />
                Ir para Login
              </Button>
            )}
            
            {type === 'general' && (
              <Button 
                variant="outline" 
                onClick={onClose || handleRefresh}
                className="border-red-500 text-red-700 hover:bg-red-100 flex gap-2 items-center"
              >
                <RefreshCw size={16} />
                Tentar Novamente
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Componente específico para erro de JWT expirado
export function JwtExpiredAlert() {
  return (
    <ErrorAlert
      title="Sessão Expirada"
      message="Sua sessão de login expirou. Por favor, atualize a página ou faça login novamente para continuar."
      type="jwt_expired"
    />
  );
}

// Componente específico para erro de autenticação
export function AuthErrorAlert() {
  return (
    <ErrorAlert
      title="Erro de Autenticação"
      message="Ocorreu um erro na sua autenticação. Por favor, faça login novamente."
      type="auth_error"
    />
  );
}
