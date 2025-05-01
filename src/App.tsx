
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NewNote from "./pages/NewNote";
import Print from "./pages/Print";
import NotFound from "./pages/NotFound";

// Protected route component
import { ReactNode, useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('fiscalFlowToken');
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    // Still checking authentication
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            path="/print" 
            element={
              <ProtectedRoute>
                <Print />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
