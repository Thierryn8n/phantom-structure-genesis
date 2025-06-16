import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email.trim() === "" || password === "") {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "error",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Login: Limpando localStorage antes de tentar login para evitar tokens corrompidos");
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('session_recovery_attempted');
      
      console.log("Login: Tentando login com email:", email);
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error("Login: Erro durante login:", error.message);
        throw error;
      }
      
      console.log("Login: Login bem-sucedido, redirecionando para:", redirectTo);
      toast({
        title: "Login bem-sucedido",
        description: "Você foi autenticado com sucesso!",
        variant: "success",
      });
      
      // Dar tempo para o contexto de autenticação atualizar
      setTimeout(() => {
        navigate(redirectTo);
      }, 500);
      
    } catch (error: any) {
      console.error("Login: Erro completo:", error);
      
      let errorMessage = "Ocorreu um erro ao fazer login. Tente novamente.";
      
      if (error.message) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha inválidos. Verifique suas credenciais.";
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
        }
      }
      
      toast({
        title: "Erro de login",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-50 to-emerald-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Fiscal Flow</h1>
          <p className="text-gray-600 mt-2">Faça login para continuar</p>
        </div>
        
        <Card className="border-gray-200 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">Acesse sua conta</CardTitle>
            <CardDescription className="text-center">Digite seu e-mail e senha para entrar</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <a href="#" className="text-xs text-green-600 hover:text-green-700">
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              
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
              <a 
                onClick={() => navigate("/register")} 
                className="text-green-600 hover:text-green-700 cursor-pointer"
              >
                Cadastre-se
              </a>
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2023 Fiscal Flow. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 