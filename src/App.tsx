
import { Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import AuthChecker from './components/AuthChecker';
import PrintMonitor from "@/components/PrintMonitor";
// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <AuthChecker />
      <CartProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Outlet />
            <Toaster />
            <PrintMonitor />
          </TooltipProvider>
        </QueryClientProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
