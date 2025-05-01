
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import Logo from '@/components/ui/Logo';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Check if the user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('fiscalFlowToken');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-fiscal-gray-50">
      <header className="bg-black text-white py-6">
        <div className="container mx-auto flex justify-center">
          <div className="flex items-center">
            <Logo />
            <h1 className="ml-3 text-2xl font-cascadia">Fiscal Flow Notes</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-cascadia">Login</h2>
              <p className="text-fiscal-gray-600 mt-2">
                Acesse sua conta compartilhada para gerenciar suas notas fiscais
              </p>
            </div>
            
            <LoginForm />
          </div>
          
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-fiscal-green-500 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
            <h3 className="font-cascadia text-lg mb-2">Acesso Seguro e Simplificado</h3>
            <p className="text-fiscal-gray-600 text-sm">
              A conta compartilhada permite que múltiplos vendedores trabalhem simultaneamente,
              gerando notas fiscais de orçamento a partir de dispositivos móveis.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="bg-black text-white py-3 text-center">
        <div className="container mx-auto">
          <p className="text-sm">
            © {new Date().getFullYear()} Fiscal Flow Notes. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
