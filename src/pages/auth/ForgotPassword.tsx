import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/ui/Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Determinar o URL para onde o usuário será redirecionado após clicar no link
      const redirectTo = `${window.location.origin}/recover-password`;
      console.log('Redirecionando para:', redirectTo);

      // Enviar email de recuperação de senha via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) throw error;

      // Indicar sucesso na interface
      setIsSuccess(true);
      toast({
        title: 'Email enviado',
        description: 'Enviamos um link de recuperação para seu email.',
      });
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      setError(error.message || 'Erro ao enviar email. Tente novamente.');
      
      toast({
        title: 'Erro ao enviar email',
        description: error.message || 'Não foi possível enviar o email de recuperação.',
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
          <p className="text-gray-600 mt-2">Recuperação de senha</p>
        </div>
        
        <Card className="border-gray-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              {isSuccess ? 'Email Enviado' : 'Recuperar Senha'}
            </CardTitle>
            <CardDescription className="text-center">
              {isSuccess 
                ? 'Verifique seu email para recuperar sua senha' 
                : 'Informe seu email para receber um link de recuperação'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center py-6">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-700 text-center max-w-sm mx-auto">
                  Enviamos um link para <strong>{email}</strong>. 
                  Verifique sua caixa de entrada e spam.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      Enviando...
                    </div>
                  ) : (
                    "Enviar Link de Recuperação"
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

export default ForgotPassword; 