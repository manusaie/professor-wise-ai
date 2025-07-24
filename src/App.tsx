import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function App() {
  const { user, loading } = useAuth();

  // Auto-login anonymous users para melhorar UX
  useEffect(() => {
    const autoLogin = async () => {
      if (!loading && !user) {
        try {
          const { error } = await supabase.auth.signInAnonymously();
          if (error && error.message !== 'Anonymous sign-ins are disabled') {
            console.error('Auto-login failed:', error);
          }
        } catch (error) {
          console.error('Auto-login error:', error);
        }
      }
    };

    autoLogin();
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/*" element={<ProtectedRoute />}>
              <Route path="" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              {/* Outras rotas protegidas podem ser adicionadas aqui */}
            </Route>
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
