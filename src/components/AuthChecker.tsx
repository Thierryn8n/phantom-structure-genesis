import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

// Páginas públicas que não precisam de autenticação
const PUBLIC_PAGES = [
  '/login',
  '/register',
  '/reset-password',
  '/',
  '/ecommerce',
  '/forgot-password',
  '/recover-password',
  '/diagnose-auth',
  '/ecommerce/auth',
  '/ecommerce/wishlist'
];

// Verifica se o caminho atual é uma página pública
const isPublicPathname = (pathname: string) => {
  return PUBLIC_PAGES.some(page => 
    pathname === page || 
    (page !== '/' && pathname.startsWith(page + '/'))
  );
};

const AuthChecker = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Verifica se a página atual é pública
  const isPublicPage = isPublicPathname(currentPath);

  useEffect(() => {
    // Log apenas para debug - não interferir no fluxo de autenticação
    if (!loading) {
      if (user) {
        console.log('AuthChecker: Usuário autenticado:', user.email);
      } else if (!isPublicPage) {
        console.log('AuthChecker: Usuário não autenticado em página protegida:', currentPath);
      }
    }
  }, [user, loading, currentPath, isPublicPage]);

  // AuthChecker agora é apenas um monitor - não interfere no fluxo
  return null;
};

export default AuthChecker;