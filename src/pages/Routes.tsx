import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import App from "@/App";
import ProtectedRoute from "@/components/ProtectedRoute";

// Importações do Layout principal
import DashboardPage from "@/pages/Dashboard";
import NotesManagement from "@/pages/NotesManagement";
import ProductsSystemPage from "@/pages/ProductManagement";

// Importações do E-commerce
import EcommerceLayout from "@/components/ecommerce/EcommerceLayout";
import EcommerceNew from "@/pages/EcommerceNew";
import ProductDetailPage from "@/pages/ecommerce/ProductDetailPage";
import Cart from "@/pages/ecommerce/Cart";
import Checkout from "@/pages/ecommerce/Checkout";
import CheckoutSuccess from "@/pages/ecommerce/CheckoutSuccess";
import Wishlist from "@/pages/ecommerce/Wishlist";
import SearchResults from "@/pages/ecommerce/SearchResults";

// Importações do Painel do E-commerce
import EcommerceDashboardLayout from "@/components/ecommerce/EcommerceDashboardLayout";
import EcommerceDashboard from "@/pages/ecommerce/Dashboard";
import OrdersKanban from "@/pages/ecommerce/OrdersKanban";
import EcommerceProducts from "@/pages/ecommerce/Products";
import EcommerceCategories from "@/pages/ecommerce/Categories";
import EcommerceCustomers from "@/pages/ecommerce/Customers";
import EcommerceSettings from "@/pages/ecommerce/Settings";

// Importações de Autenticação
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import NotFound from "@/pages/NotFound";
import StoreThemeProvider from "@/components/ecommerce/StoreThemeProvider";

export const router = createBrowserRouter([
  // Rotas do E-commerce (Loja Pública - sem autenticação)
  {
    path: "/ecommerce",
    element: (
      <StoreThemeProvider>
        <EcommerceLayout>
          <Outlet />
        </EcommerceLayout>
      </StoreThemeProvider>
    ),
    errorElement: <NotFound />,
    children: [
      { index: true, element: <EcommerceNew /> },
      { path: "products/:productId", element: <ProductDetailPage /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "checkout/success", element: <CheckoutSuccess /> },
      { path: "wishlist", element: <Wishlist /> },
      { path: "search", element: <SearchResults /> },
    ],
  },
  
  // Rotas do Sistema Principal (com autenticação)
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { 
        path: "dashboard", 
        element: <ProtectedRoute><DashboardPage /></ProtectedRoute> 
      },
      { 
        path: "notes", 
        element: <ProtectedRoute><NotesManagement /></ProtectedRoute> 
      },
      { 
        path: "products-system", 
        element: <ProtectedRoute><ProductsSystemPage /></ProtectedRoute> 
      },

      // Rotas do Painel do E-commerce (com autenticação)
      {
        path: "ecommerce-admin",
        element: <ProtectedRoute><EcommerceDashboardLayout><Outlet /></EcommerceDashboardLayout></ProtectedRoute>,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <EcommerceDashboard /> },
          { path: "orders", element: <OrdersKanban /> },
          { path: "products", element: <EcommerceProducts /> },
          { path: "categories", element: <EcommerceCategories /> },
          { path: "customers", element: <EcommerceCustomers /> },
          { path: "settings", element: <EcommerceSettings /> },
        ],
      },
    ],
  },

  // Rotas de Autenticação
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
]); 