import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, Loader2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from './ui/Logo';

const RecoverPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Extrair token de recuperação da URL
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const type = searchParams.get('type');
  
  useEffect(() => {
    console.log('Parâmetros de URL:', { token: token?.substring(0, 5) + '...', email, type });
    
    // Se não tiver token ou email na URL, redirecionar para login
    if (!token || !email) {
      toast({
        title: 'Link inválido',
        description: 'Este link de recuperação é inválido ou expirou.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [token, email, navigate, toast]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Para tokens de login mágico ou recuperação
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      // Indicar sucesso na interface
      setIsSuccess(true);
      toast({
        title: 'Senha atualizada com sucesso',
        description: 'Sua nova senha foi definida. Você será redirecionado para o dashboard.',
      });
      
      // Redirecionar após um pequeno delay para mostrar mensagem de sucesso
      setTimeout(() => {
        navigate('/login?password_reset=success');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao redefinir a senha:', error);
      setError(error.message || 'Erro ao redefinir a senha. Tente novamente.');
      
      // Se o erro for de expiração do token
      if (error.message?.includes('expired')) {
        toast({
          title: 'Link expirado',
          description: 'O link de redefinição de senha expirou. Solicite um novo.',
          variant: 'destructive',
        });
        
        // Redirecionar para login após breve delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
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
          <p className="text-gray-600 mt-2">Defina sua nova senha</p>
        </div>
        
        <Card className="border-gray-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              {isSuccess ? 'Senha Atualizada' : 'Criar Nova Senha'}
            </CardTitle>
            <CardDescription className="text-center">
              {isSuccess 
                ? 'Sua senha foi alterada com sucesso!' 
                : 'Crie uma senha forte para sua conta'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center py-6">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-700 text-center">
                  Redirecionando para o dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl pr-10"
                      required
                    />
                    <Lock className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme sua nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      Processando...
                    </div>
                  ) : (
                    "Salvar Nova Senha"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600">
              Lembrou sua senha?{" "}
              <a 
                onClick={() => navigate("/login")} 
                className="text-green-600 hover:text-green-700 cursor-pointer"
              >
                Faça Login
              </a>
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

export default RecoverPassword; 