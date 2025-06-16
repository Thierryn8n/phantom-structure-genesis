import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md w-full px-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="bg-red-500/10 p-4 rounded-full">
              <h1 className="text-6xl font-bold text-red-500">404</h1>
            </div>
          </div>
          
          <h2 className="text-2xl font-cascadia text-gray-800 mb-4">Página não encontrada</h2>
          
          <p className="text-gray-600 mb-6">
            A página que você está procurando não existe ou foi movida para outro local.
          </p>
          
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-5 py-3 bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white rounded-lg transition-colors"
          >
            <Home size={18} className="mr-2" />
            Voltar para o Início
          </Link>
        </div>
        
        <p className="mt-6 text-sm text-gray-500">
          Se você acredita que isto é um erro, por favor entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
