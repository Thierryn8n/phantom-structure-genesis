import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

type AuthMode = 'login' | 'register';

const authSchema = z.object({
  email: z.string().email('Digite um email válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  fullName: z.string().optional(),
});

const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  });

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const onSubmit = async (values: z.infer<typeof authSchema>) => {
    setIsLoading(true);
    
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Cadastro realizado com sucesso!',
          description: 'Você já pode fazer login no sistema.',
        });
        
        setMode('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) throw error;

        // Configurar o ID do usuário no localStorage
        if (data && data.user) {
          localStorage.setItem('default_user_id', data.user.id);
        }

        toast({
          title: 'Login efetuado com sucesso!',
          description: 'Bem-vindo ao Fiscal Flow Notes.',
        });
        
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao processar sua solicitação';
      
      toast({
        title: mode === 'login' ? 'Erro no login' : 'Erro no cadastro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {mode === 'register' && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome completo" 
                      {...field} 
                      autoComplete="name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="email@empresa.com" 
                    {...field}
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-black hover:bg-gray-800 text-white"
            disabled={isLoading}
          >
            {isLoading 
              ? 'Carregando...' 
              : mode === 'login' ? 'Entrar' : 'Cadastrar'
            }
          </Button>
        </form>
      </Form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-fiscal-gray-500">
          {mode === 'login' 
            ? 'Não tem uma conta?' 
            : 'Já possui uma conta?'
          }
          <button
            onClick={toggleMode}
            className="ml-2 text-fiscal-green-600 hover:text-fiscal-green-800 font-medium"
          >
            {mode === 'login' ? 'Cadastre-se' : 'Fazer login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
