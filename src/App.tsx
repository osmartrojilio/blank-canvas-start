import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlatformAdminProvider } from "@/contexts/PlatformAdminContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CompletarCadastro from "./pages/CompletarCadastro";
import Veiculos from "./pages/Veiculos";
import Abastecimentos from "./pages/Abastecimentos";
import Viagens from "./pages/Viagens";
import Clientes from "./pages/Clientes";
import Despesas from "./pages/Despesas";
import Relatorios from "./pages/Relatorios";
import Anexos from "./pages/Anexos";
import Usuarios from "./pages/Usuarios";
import Planos from "./pages/Planos";
import Configuracoes from "./pages/Configuracoes";
import Manutencoes from "./pages/Manutencoes";
import PlatformAdmin from "./pages/PlatformAdmin";
import NotFound from "./pages/NotFound";
import AceitarConvite from "./pages/AceitarConvite";
import ApiDocumentation from "./pages/ApiDocumentation";
import Suporte from "./pages/Suporte";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import VerificarEmail from "./pages/VerificarEmail";
import RedefinirSenha from "./pages/RedefinirSenha";
import Catalogo from "./pages/Catalogo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlatformAdminProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/completar-cadastro" element={<CompletarCadastro />} />
              <Route path="/verificar-email" element={<VerificarEmail />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              <Route path="/aceitar-convite" element={<AceitarConvite />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
              <Route path="/platform-admin" element={<PlatformAdmin />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/veiculos"
                element={
                  <ProtectedRoute>
                    <Veiculos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/abastecimentos"
                element={
                  <ProtectedRoute>
                    <Abastecimentos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/viagens"
                element={
                  <ProtectedRoute>
                    <Viagens />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/despesas"
                element={
                  <ProtectedRoute>
                    <Despesas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manutencoes"
                element={
                  <ProtectedRoute>
                    <Manutencoes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute requiresPaidPlan>
                    <Relatorios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/anexos"
                element={
                  <ProtectedRoute requiresPaidPlan>
                    <Anexos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Usuarios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planos"
                element={
                  <ProtectedRoute>
                    <Planos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <Configuracoes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/suporte"
                element={
                  <ProtectedRoute>
                    <Suporte />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-docs"
                element={
                  <ProtectedRoute requiredRole="admin" requiresPaidPlan>
                    <ApiDocumentation />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PlatformAdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
