
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock authentication for now
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // This is a placeholder for actual Supabase authentication
      // In a real implementation, you would use Supabase auth here
      if (email && password) {
        // Mock successful login
        localStorage.setItem('fiscalFlowToken', 'mock-token');
        
        toast({
          title: 'Login efetuado com sucesso!',
          description: 'Bem-vindo ao Fiscal Flow Notes.',
        });
        
        navigate('/dashboard');
      } else {
        throw new Error('Por favor, preencha todos os campos.');
      }
    } catch (error) {
      toast({
        title: 'Erro no login',
        description: error instanceof Error ? error.message : 'Ocorreu um erro durante o login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="email@empresa.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="form-label">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="••••••••"
            required
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex justify-center items-center"
          >
            {isLoading ? (
              <span className="mr-2">Carregando...</span>
            ) : (
              'Entrar'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-fiscal-gray-500">
          Conta compartilhada para todos vendedores.
          <br />
          Entre em contato com o administrador para obter as credenciais.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
