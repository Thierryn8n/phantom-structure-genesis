
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Home, FileText, Printer, LogOut } from 'lucide-react';
import Logo from './ui/Logo';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    // For now, just removing the token from localStorage
    localStorage.removeItem('fiscalFlowToken');
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Logo />
            <h1 className="ml-3 text-xl font-cascadia hidden md:block">Fiscal Flow Notes</h1>
          </div>
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-white hover:text-fiscal-green-400"
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>
          </div>
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/dashboard">
              <Home size={18} className="mr-1" />
              Início
            </NavLink>
            <NavLink to="/notes/new">
              <FileText size={18} className="mr-1" />
              Nova Nota
            </NavLink>
            <NavLink to="/print">
              <Printer size={18} className="mr-1" />
              Impressão
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center text-white hover:text-fiscal-green-400 transition-colors"
            >
              <LogOut size={18} className="mr-1" />
              Sair
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black text-white">
          <nav className="flex flex-col py-2">
            <MobileNavLink to="/dashboard" onClick={toggleMobileMenu}>
              <Home size={18} className="mr-2" />
              Início
            </MobileNavLink>
            <MobileNavLink to="/notes/new" onClick={toggleMobileMenu}>
              <FileText size={18} className="mr-2" />
              Nova Nota
            </MobileNavLink>
            <MobileNavLink to="/print" onClick={toggleMobileMenu}>
              <Printer size={18} className="mr-2" />
              Impressão
            </MobileNavLink>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left text-white hover:bg-fiscal-gray-800 px-4 py-2"
            >
              <LogOut size={18} className="mr-2" />
              Sair
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow container mx-auto py-6 px-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-4 text-center">
        <div className="container mx-auto">
          <p className="text-sm">
            © {new Date().getFullYear()} Fiscal Flow Notes. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  children: ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children }) => (
  <Link
    to={to}
    className="flex items-center text-white hover:text-fiscal-green-400 transition-colors"
  >
    {children}
  </Link>
);

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, onClick, children }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center text-white hover:bg-fiscal-gray-800 px-4 py-2"
  >
    {children}
  </Link>
);

export default Layout;
