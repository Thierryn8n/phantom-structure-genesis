import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/ui/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Obtém o parâmetro de redirecionamento da URL
  const getRedirectPath = () => {
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect');
    return redirectPath ? decodeURIComponent(redirectPath) : '/dashboard';
  };

  // Verificar se há parâmetros na URL indicando redefinição de senha
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const passwordReset = urlParams.get('password_reset');
    
    if (passwordReset === 'success') {
      toast({
        title: 'Senha redefinida com sucesso',
        description: 'Sua senha foi alterada. Faça login com sua nova senha.',
        variant: 'success',
      });
      
      // Limpar apenas o parâmetro password_reset mantendo o redirect
      const redirectParam = urlParams.get('redirect');
      if (redirectParam) {
        window.history.replaceState({}, document.title, `${window.location.pathname}?redirect=${redirectParam}`);
      } else {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Verificar se o usuário foi redirecionado para o login por falta de autenticação
    if (urlParams.has('redirect')) {
      toast({
        title: 'Autenticação necessária',
        description: 'Faça login para acessar esta página.',
        variant: 'default',
      });
    }
  }, [toast, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Login bem-sucedido
      toast({
        title: 'Login realizado com sucesso',
        description: 'Redirecionando...',
      });

      // Obter o caminho de redirecionamento
      const redirectPath = getRedirectPath();

      // Aguardar um pouco para garantir que o contexto de autenticação atualizou
      setTimeout(() => {
        console.log('Redirecionando para:', redirectPath);
        navigate(redirectPath);
      }, 1000);
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Mensagem de erro amigável
      let errorMessage = 'Ocorreu um erro ao fazer login.';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login.';
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Falha no login',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-50 to-emerald-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Fiscal Flow</h1>
          <p className="text-gray-600 mt-2">Acesse sua conta</p>
        </div>
        
        <Card className="border-gray-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              Login
            </CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Seu email de acesso"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl pr-10"
                    required
                  />
                  <Mail className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <a 
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-green-600 hover:text-green-700 cursor-pointer"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl pr-10"
                    required
                  />
                  <Lock className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{" "}
              <span className="text-green-600 font-medium">
                Entre em contato com o administrador
              </span>
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Fiscal Flow. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 