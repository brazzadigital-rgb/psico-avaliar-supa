import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import { PermissionsProvider } from "@/hooks/usePermissions";
import HomePage from "./pages/HomePage";
import QuemSomosPage from "./pages/QuemSomosPage";
import EspecialidadesPage from "./pages/EspecialidadesPage";
import AssinaturasPage from "./pages/AssinaturasPage";
import FinanciamentoPage from "./pages/FinanciamentoPage";
import ContatoPage from "./pages/ContatoPage";
import FAQPage from "./pages/FAQPage";
import NotFound from "./pages/NotFound";
import AvaliacaoPage from "./pages/especialidades/AvaliacaoPage";
import PsicoterapiaPage from "./pages/especialidades/PsicoterapiaPage";
import TerapiaABAPage from "./pages/especialidades/TerapiaABAPage";
import PsiquiatriaPage from "./pages/especialidades/PsiquiatriaPage";
import PsicopedagogiaPage from "./pages/especialidades/PsicopedagogiaPage";
import AgendarPage from "./pages/AgendarPage";
import ConfirmacaoPage from "./pages/ConfirmacaoPage";
import ConsultaCodigoPage from "./pages/ConsultaCodigoPage";
// Legal pages
import PoliticaPrivacidadePage from "./pages/PoliticaPrivacidadePage";
import TermosUsoPage from "./pages/TermosUsoPage";
// Blog pages
import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";
// Auth pages
import LoginPage from "./pages/LoginPage";
import CadastroPage from "./pages/CadastroPage";
import RecuperarSenhaPage from "./pages/RecuperarSenhaPage";
// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import AgendamentosPage from "./pages/admin/AgendamentosPage";
import ServicosPage from "./pages/admin/ServicosPage";
import ClientesPage from "./pages/admin/ClientesPage";
import ProfissionaisPage from "./pages/admin/ProfissionaisPage";
import BlogPage from "./pages/admin/BlogPage";
import PlanosPage from "./pages/admin/PlanosPage";
import PacotesPage from "./pages/admin/PacotesPage";
import DisponibilidadePage from "./pages/admin/DisponibilidadePage";
import ConfiguracoesPage from "./pages/admin/ConfiguracoesPage";
import EmailTemplatesPage from "./pages/admin/EmailTemplatesPage";
import PushConfigPage from "./pages/admin/PushConfigPage";
import MensagensPage from "./pages/admin/MensagensPage";
import AjudaPage from "./pages/admin/AjudaPage";
import BriefingAdminPage from "./pages/admin/BriefingAdminPage";
import UsuariosPage from "./pages/admin/UsuariosPage";
import RolesPage from "./pages/admin/RolesPage";
import PermissoesPage from "./pages/admin/PermissoesPage";
import AuditoriaPage from "./pages/admin/AuditoriaPage";
import RecepcaoPage from "./pages/admin/RecepcaoPage";
import NotificacoesPage from "./pages/admin/NotificacoesPage";
import RelatoriosPage from "./pages/admin/RelatoriosPage";
// Payment pages
import PedidosPage from "./pages/admin/PedidosPage";
import PagamentosConfigPage from "./pages/admin/PagamentosConfigPage";
// Client portal pages
import ClienteLayout from "./pages/cliente/ClienteLayout";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import ClienteConsultas from "./pages/cliente/ClienteConsultas";
import ClientePerfil from "./pages/cliente/ClientePerfil";
import ClientePagamentos from "./pages/cliente/ClientePagamentos";
import ClienteNotificacoes from "./pages/cliente/ClienteNotificacoes";
import ClienteConfigNotificacoes from "./pages/cliente/ClienteConfigNotificacoes";
// Checkout page
import CheckoutPage from "./pages/CheckoutPage";
// Check-in page
import CheckInPage from "./pages/CheckInPage";
// Briefing page
import BriefingPage from "./pages/BriefingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PermissionsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/quem-somos" element={<QuemSomosPage />} />
              <Route path="/especialidades" element={<EspecialidadesPage />} />
              <Route path="/especialidades/avaliacao-psicologica-e-neuropsicologica" element={<AvaliacaoPage />} />
              <Route path="/especialidades/psicoterapia" element={<PsicoterapiaPage />} />
              <Route path="/especialidades/terapia-aba" element={<TerapiaABAPage />} />
              <Route path="/especialidades/psiquiatria" element={<PsiquiatriaPage />} />
              <Route path="/especialidades/psicopedagogia" element={<PsicopedagogiaPage />} />
              <Route path="/assinaturas" element={<AssinaturasPage />} />
              <Route path="/financiamento" element={<FinanciamentoPage />} />
              <Route path="/contato" element={<ContatoPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/agendar" element={<AgendarPage />} />
              <Route path="/agendar/confirmacao" element={<ConfirmacaoPage />} />
              {/* Checkout */}
              <Route path="/checkout" element={<CheckoutPage />} />
              {/* Check-in via QR Code */}
              <Route path="/checkin/:code" element={<CheckInPage />} />
              {/* Consulta por código (público) */}
              <Route path="/consulta" element={<ConsultaCodigoPage />} />
              <Route path="/consulta/:codigo" element={<ConsultaCodigoPage />} />
              {/* Blog */}
              <Route path="/blog" element={<BlogListPage />} />
              <Route path="/blog/categoria/:categorySlug" element={<BlogListPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              {/* Legal pages */}
              <Route path="/politica-de-privacidade" element={<PoliticaPrivacidadePage />} />
              <Route path="/termos-de-uso" element={<TermosUsoPage />} />
              
              {/* Briefing page (token protected) */}
              <Route path="/briefing" element={<BriefingPage />} />
              
              {/* Auth pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<CadastroPage />} />
              <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
              
              {/* Admin pages */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="recepcao" element={<RecepcaoPage />} />
                <Route path="agendamentos" element={<AgendamentosPage />} />
                <Route path="servicos" element={<ServicosPage />} />
                <Route path="clientes" element={<ClientesPage />} />
                <Route path="profissionais" element={<ProfissionaisPage />} />
                <Route path="blog" element={<BlogPage />} />
                <Route path="planos" element={<PlanosPage />} />
                <Route path="pacotes" element={<PacotesPage />} />
                <Route path="disponibilidade" element={<DisponibilidadePage />} />
                <Route path="configuracoes" element={<ConfiguracoesPage />} />
                <Route path="email-templates" element={<EmailTemplatesPage />} />
                <Route path="push" element={<PushConfigPage />} />
                <Route path="mensagens" element={<MensagensPage />} />
                <Route path="ajuda" element={<AjudaPage />} />
                <Route path="briefing" element={<BriefingAdminPage />} />
                {/* Payment pages */}
                <Route path="pedidos" element={<PedidosPage />} />
                <Route path="pagamentos" element={<PagamentosConfigPage />} />
                {/* Notifications and Reports */}
                <Route path="notificacoes" element={<NotificacoesPage />} />
                <Route path="relatorios" element={<RelatoriosPage />} />
                {/* Security pages (admin only) */}
                <Route path="usuarios" element={<UsuariosPage />} />
                <Route path="roles" element={<RolesPage />} />
                <Route path="permissoes" element={<PermissoesPage />} />
                <Route path="auditoria" element={<AuditoriaPage />} />
              </Route>
              
              {/* Client portal */}
              <Route path="/cliente" element={<ClienteLayout />}>
                <Route index element={<ClienteDashboard />} />
                <Route path="consultas" element={<ClienteConsultas />} />
                <Route path="pagamentos" element={<ClientePagamentos />} />
                <Route path="perfil" element={<ClientePerfil />} />
                <Route path="notificacoes" element={<ClienteNotificacoes />} />
                <Route path="config-notificacoes" element={<ClienteConfigNotificacoes />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PermissionsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
