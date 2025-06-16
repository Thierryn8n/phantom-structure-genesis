import { Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import AuthChecker from './components/AuthChecker';
import PrintMonitor from "@/components/PrintMonitor";
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import RecoverPassword from './components/RecoverPassword'
import StoreThemeProvider from './components/ecommerce/StoreThemeProvider';
import StoreLayout from './components/ecommerce/StoreLayout';

import Dashboard from "./pages/Dashboard";
import NewNote from "./pages/NewNote";
import ViewNote from "./pages/ViewNote";
import Print from "./pages/Print";
import ProductManagement from "./pages/ProductManagement";
import CustomersManagement from "./pages/CustomersManagement";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import SellersManagement from "./pages/SellersManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotesManagement from "./pages/NotesManagement";
import EcommerceNew from "./pages/EcommerceNew";
import Checkout from "./pages/ecommerce/Checkout";
import CheckoutSuccess from "./pages/ecommerce/CheckoutSuccess";
import DiagnoseAuth from "./diagnose-auth";

// Importação dos novos componentes do painel de ecommerce
import EcommerceDashboard from "./pages/ecommerce/Dashboard";
import EcommerceOrders from "./pages/ecommerce/Orders";
import OrdersKanban from "./pages/ecommerce/OrdersKanban";
import EcommerceProducts from "./pages/ecommerce/Products";
import EcommerceCustomers from "./pages/ecommerce/Customers";
import EcommerceSettings from "./pages/ecommerce/Settings";
import EcommerceCategories from "./pages/ecommerce/Categories";
import Wishlist from "./pages/ecommerce/Wishlist";
import Auth from "./pages/ecommerce/Auth";
import ProductDetailPage from "./pages/ecommerce/ProductDetailPage";
import SearchResults from "./pages/ecommerce/SearchResults";

// Create a client
const queryClient = new QueryClient();

function App() {
  const location = useLocation();
  const isEcommercePage = 
    location.pathname.startsWith('/ecommerce') || 
    location.pathname.startsWith('/checkout') || 
    location.pathname.startsWith('/products/');

  return (
    <AuthProvider>
      <AuthChecker />
      <CartProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notes/new" 
                element={
                  <ProtectedRoute>
                    <NewNote />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notes/view/:id" 
                element={
                  <ProtectedRoute>
                    <ViewNote />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/print" 
                element={
                  <ProtectedRoute>
                    <Print />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/print/:id" 
                element={
                  <ProtectedRoute>
                    <Print />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products" 
                element={
                  <ProtectedRoute>
                    <ProductManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customers" 
                element={
                  <ProtectedRoute>
                    <CustomersManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sellers" 
                element={
                  <ProtectedRoute>
                    <SellersManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notes" 
                element={
                  <ProtectedRoute>
                    <NotesManagement />
                  </ProtectedRoute>
                } 
              />
              {/* Rotas de e-commerce - envolvidas com o StoreThemeProvider */}
              <Route 
                path="/ecommerce" 
                element={
                  <StoreThemeProvider>
                    <EcommerceNew />
                  </StoreThemeProvider>
                } 
              />
              <Route 
                path="/products/:productId" 
                element={
                  <StoreThemeProvider>
                      <ProductDetailPage />
                  </StoreThemeProvider>
                } 
              />
              <Route 
                path="/ecommerce/checkout"
                element={
                    <StoreThemeProvider>
                        <Checkout />
                    </StoreThemeProvider>
                }
              />
              <Route 
                path="/ecommerce/checkout/success"
                element={
                    <StoreThemeProvider>
                      <CheckoutSuccess />
                    </StoreThemeProvider>
                }
              />
              <Route 
                path="/ecommerce/wishlist" 
                element={
                  <StoreThemeProvider>
                      <Wishlist />
                  </StoreThemeProvider>
                } 
              />
              <Route 
                path="/ecommerce/search" 
                element={
                  <StoreThemeProvider>
                    <SearchResults />
                  </StoreThemeProvider>
                } 
              />
              {/* Rotas do Painel de Ecommerce - Estas SIM precisam de autenticação */}
              <Route 
                path="/ecommerce-admin" 
                element={
                  <ProtectedRoute>
                    <EcommerceDashboard />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/ecommerce-admin/customers" 
                element={
                  <ProtectedRoute>
                    <EcommerceCustomers />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/ecommerce-admin/orders" 
                element={
                  <ProtectedRoute>
                    <OrdersKanban />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/ecommerce-admin/products" 
                element={
                  <ProtectedRoute>
                    <EcommerceProducts />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/ecommerce-admin/settings" 
                element={
                  <ProtectedRoute>
                    <EcommerceSettings />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/ecommerce-admin/categories" 
                element={
                  <ProtectedRoute>
                    <EcommerceCategories />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/recover-password" element={<RecoverPassword />} />
              <Route path="/diagnose-auth" element={<DiagnoseAuth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
              
            {/* Monitor de impressão - apenas exibido em desktop e fora de páginas de ecommerce */}
            {!isEcommercePage && <PrintMonitor />}
          </TooltipProvider>
        </QueryClientProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
