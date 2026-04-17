import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RequestDemo from "./pages/RequestDemo";
import Bootstrap from "./pages/Bootstrap";
import SuperAdmin from "./pages/SuperAdmin";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Routes the super-admin to /super, everyone else to the workspace
function AppRoot() {
  const { isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  return isSuperAdmin ? <Navigate to="/super" replace /> : <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/request-demo" element={<RequestDemo />} />
            <Route path="/bootstrap" element={<Bootstrap />} />

            {/* AUTHENTICATED WORKSPACE */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppRoot />
                </ProtectedRoute>
              }
            />

            {/* SUPER-ADMIN ONLY */}
            <Route
              path="/super"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdmin />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
