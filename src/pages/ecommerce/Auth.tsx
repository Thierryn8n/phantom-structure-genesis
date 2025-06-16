import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StoreLayout from '@/components/ecommerce/StoreLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Facebook, Github, ArrowLeft } from 'lucide-react';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState('login');
  
  // Estados do formulário de login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Estados do formulário de cadastro
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Login de usuário
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aqui seria a integração com o backend para autenticação
    // Por enquanto, vamos apenas simular um login bem-sucedido
    
    toast({
      title: 'Login realizado',
      description: 'Você foi autenticado com sucesso!',
    });
    
    navigate('/ecommerce');
  };
  
  // Cadastro de usuário
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!registerName.trim()) {
      toast({
        title: 'Erro no cadastro',
        description: 'Por favor, informe seu nome completo.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!registerEmail.includes('@')) {
      toast({
        title: 'Erro no cadastro',
        description: 'Por favor, informe um e-mail válido.',
        variant: 'destructive',
      });
      return;
    }
    
    if (registerPassword.length < 6) {
      toast({
        title: 'Erro no cadastro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: 'Erro no cadastro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!acceptTerms) {
      toast({
        title: 'Erro no cadastro',
        description: 'Você precisa aceitar os termos e condições.',
        variant: 'destructive',
      });
      return;
    }
    
    // Aqui seria a integração com o backend para cadastro
    // Por enquanto, vamos apenas simular um cadastro bem-sucedido
    
    toast({
      title: 'Cadastro realizado',
      description: 'Sua conta foi criada com sucesso!',
    });
    
    setTab('login');
  };
  
  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-10 max-w-md">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate('/ecommerce')}
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar à loja
          </Button>
          <h1 className="text-3xl font-bold mb-2">Bem-vindo à TOOLPART</h1>
          <p className="text-gray-500">
            Acesse sua conta ou crie uma nova para gerenciar seus pedidos, acompanhar entregas e muito mais.
          </p>
        </div>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger 
              value="login" 
              className="text-base font-medium data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              className="text-base font-medium data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <Label htmlFor="login-email" className="block mb-2">
                    E-mail
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="mb-6">
                  <Label htmlFor="login-password" className="block mb-2">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      className="mr-2 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                    />
                    <label htmlFor="remember-me" className="text-sm">
                      Lembrar-me
                    </label>
                  </div>
                  
                  <Link to="/forgot-password" className="text-sm text-yellow-600 hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 mb-4"
                >
                  Entrar
                </Button>
                
                <div className="relative flex items-center justify-center mb-4">
                  <Separator className="absolute w-full" />
                  <span className="relative px-2 bg-white text-sm text-gray-500">
                    ou continue com
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <Facebook size={18} className="mr-2" />
                    Facebook
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
                      <path fill="#EA4335" d="M5.266 9.805C6.205 7.395 8.399 5.665 10.985 5.665C12.376 5.665 13.64 6.13 14.649 6.999L17.689 3.936C15.896 2.321 13.582 1.334 10.985 1.334C6.591 1.334 2.794 4.082 1.077 8.003L5.266 9.805Z" />
                      <path fill="#34A853" d="M10.985 18.665C13.582 18.665 15.896 17.821 17.689 16.183L14.351 13.341C13.359 14.057 12.17 14.517 10.985 14.489C8.411 14.489 6.222 12.781 5.272 10.398L1.044 12.131C2.76 15.983 6.547 18.665 10.985 18.665Z" />
                      <path fill="#4A90E2" d="M17.873 7.5C18.505 8.636 18.846 9.929 18.846 11.332C18.846 11.825 18.787 12.318 18.698 12.788H10.985V8.667H17.873V7.5Z" />
                      <path fill="#FBBC05" d="M5.272 10.398C5.03 9.725 4.895 9.014 4.895 8.272C4.895 7.53 5.03 6.819 5.266 6.146L1.077 4.319C0.389 5.55 0 6.944 0 8.391C0 9.838 0.389 11.232 1.044 12.428L5.272 10.398Z" />
                    </svg>
                    Google
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="register">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <form onSubmit={handleRegister}>
                <div className="mb-4">
                  <Label htmlFor="register-name" className="block mb-2">
                    Nome completo
                  </Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="register-email" className="block mb-2">
                    E-mail
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="register-password" className="block mb-2">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Crie uma senha"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                </div>
                
                <div className="mb-6">
                  <Label htmlFor="register-confirm-password" className="block mb-2">
                    Confirmar senha
                  </Label>
                  <Input
                    id="register-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirme sua senha"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center">
                    <Checkbox
                      id="accept-terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                      className="mr-2 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                    />
                    <label htmlFor="accept-terms" className="text-sm">
                      Li e aceito os{' '}
                      <Link to="/terms" className="text-yellow-600 hover:underline">
                        Termos e Condições
                      </Link>{' '}
                      e a{' '}
                      <Link to="/privacy" className="text-yellow-600 hover:underline">
                        Política de Privacidade
                      </Link>
                    </label>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 mb-4"
                >
                  Criar conta
                </Button>
                
                <div className="relative flex items-center justify-center mb-4">
                  <Separator className="absolute w-full" />
                  <span className="relative px-2 bg-white text-sm text-gray-500">
                    ou continue com
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <Facebook size={18} className="mr-2" />
                    Facebook
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
                      <path fill="#EA4335" d="M5.266 9.805C6.205 7.395 8.399 5.665 10.985 5.665C12.376 5.665 13.64 6.13 14.649 6.999L17.689 3.936C15.896 2.321 13.582 1.334 10.985 1.334C6.591 1.334 2.794 4.082 1.077 8.003L5.266 9.805Z" />
                      <path fill="#34A853" d="M10.985 18.665C13.582 18.665 15.896 17.821 17.689 16.183L14.351 13.341C13.359 14.057 12.17 14.517 10.985 14.489C8.411 14.489 6.222 12.781 5.272 10.398L1.044 12.131C2.76 15.983 6.547 18.665 10.985 18.665Z" />
                      <path fill="#4A90E2" d="M17.873 7.5C18.505 8.636 18.846 9.929 18.846 11.332C18.846 11.825 18.787 12.318 18.698 12.788H10.985V8.667H17.873V7.5Z" />
                      <path fill="#FBBC05" d="M5.272 10.398C5.03 9.725 4.895 9.014 4.895 8.272C4.895 7.53 5.03 6.819 5.266 6.146L1.077 4.319C0.389 5.55 0 6.944 0 8.391C0 9.838 0.389 11.232 1.044 12.428L5.272 10.398Z" />
                    </svg>
                    Google
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            {tab === 'login' ? (
              <>
                Não tem uma conta?{' '}
                <button 
                  onClick={() => setTab('register')}
                  className="text-yellow-600 hover:underline font-medium"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{' '}
                <button 
                  onClick={() => setTab('login')}
                  className="text-yellow-600 hover:underline font-medium"
                >
                  Faça login
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </StoreLayout>
  );
};

export default Auth; 