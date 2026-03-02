import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Printer, 
  ChevronRight,
  Globe,
  Lock,
  Users,
  Calendar,
  Mail,
  Video,
  Shield,
  BookOpen,
  Settings,
  LayoutDashboard,
  Loader2,
  AlertCircle,
  Check,
  MessageSquare,
  History,
  CreditCard,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChecklistItem {
  id: string;
  label: string;
  description: string | null;
  display_order: number;
}

interface ChecklistResponse {
  item_id: string;
  decision: "approved" | "adjust" | "na";
  comment: string;
}

interface BriefingContent {
  section_key: string;
  title: string;
  content: string;
}

const MODULES = [
  { name: "CMS do Site", description: "Páginas editáveis pelo painel administrativo", status: "Pronto" },
  { name: "Blog", description: "Posts, categorias, tags e SEO integrado", status: "Pronto" },
  { name: "Agendamento Online", description: "Serviços, slots de disponibilidade e calendário", status: "Pronto" },
  { name: "Painel Admin", description: "Dashboard, clientes, consultas, profissionais, disponibilidade", status: "Pronto" },
  { name: "Autenticação", description: "Login, cadastro, recuperação de senha, RBAC", status: "Pronto" },
  { name: "Portal do Cliente", description: "Minhas consultas, perfil, histórico", status: "Pronto" },
  { name: "SMTP + E-mails", description: "Confirmações, lembretes, remarcação, cancelamento", status: "Pronto" },
  { name: "Google Meet", description: "Link manual + estrutura para integração automática", status: "Pronto" },
  { name: "LGPD & Segurança", description: "Políticas, consentimentos, logs de auditoria", status: "Pronto" },
  { name: "Pagamentos", description: "Integração Appmax (Pix, Cartão, Boleto) com modo teste", status: "Pronto" },
];

const UPDATES = [
  {
    date: "21/01/2026",
    category: "Pagamentos",
    items: [
      "Integração completa com gateway Appmax para pagamentos",
      "Suporte a Pix com QR Code e copia-e-cola",
      "Suporte a cartão de crédito com animação de processamento",
      "Suporte a boleto bancário",
      "Modo de teste funcional sem credenciais (simulação)",
      "Animações de confirmação de pagamento (Pix e Cartão)",
    ],
  },
  {
    date: "21/01/2026",
    category: "Agendamentos",
    items: [
      "Adicionada data/hora de criação do agendamento na listagem admin",
      "Adicionada data/hora de criação no modal de detalhes (admin)",
      "Adicionada data de criação na listagem de consultas do cliente",
      "Adicionada data de criação no modal de detalhes do cliente",
      "Exibição de data de atualização quando diferente da criação",
    ],
  },
  {
    date: "21/01/2026",
    category: "Checkout",
    items: [
      "Fluxo completo de checkout com múltiplos métodos de pagamento",
      "Página de confirmação com animações celebratórias",
      "Download de PDF do agendamento",
      "Envio de confirmação por e-mail",
      "QR Code para check-in presencial",
    ],
  },
];

const ADMIN_ROLES = [
  { role: "Admin", access: "Acesso total ao sistema, gestão de usuários e configurações" },
  { role: "Recepção", access: "Agendamentos, clientes, consultas e mensagens" },
  { role: "Profissional", access: "Própria agenda, consultas atribuídas e disponibilidade" },
  { role: "Cliente", access: "Portal do cliente com consultas e perfil próprio" },
];

const SCHEDULING_FLOW = [
  { step: 1, title: "Selecionar Serviço", description: "Cliente escolhe o tipo de atendimento desejado" },
  { step: 2, title: "Modalidade", description: "Presencial ou Online (videochamada)" },
  { step: 3, title: "Data e Hora", description: "Slots baseados na disponibilidade do profissional" },
  { step: 4, title: "Dados do Cliente", description: "Informações pessoais e consentimento LGPD" },
  { step: 5, title: "Pagamento", description: "Pix, Cartão de Crédito ou Boleto (quando aplicável)" },
  { step: 6, title: "Confirmação", description: "E-mails automáticos e código de consulta" },
];

const EMAIL_EVENTS = [
  "Cadastro / Boas-vindas",
  "Recuperação de senha",
  "Confirmação de agendamento",
  "Lembrete 24h antes",
  "Lembrete 2h antes",
  "Remarcação de consulta",
  "Cancelamento de consulta",
  "Pós-consulta (feedback)",
  "Confirmação de pagamento",
];

export default function BriefingPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>({});
  const [briefingContent, setBriefingContent] = useState<Record<string, BriefingContent>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [approverName, setApproverName] = useState("");
  const [approverEmail, setApproverEmail] = useState("");
  const [finalNotes, setFinalNotes] = useState("");

  useEffect(() => {
    if (token) {
      validateTokenAndLoad();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateTokenAndLoad = async () => {
    try {
      // Validate token
      const { data: linkData, error: linkError } = await supabase
        .from("briefing_links")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .maybeSingle();

      if (linkError || !linkData) {
        setValidToken(false);
        setLoading(false);
        return;
      }

      // Check expiration
      if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
        setValidToken(false);
        setLoading(false);
        return;
      }

      setValidToken(true);

      // Log access
      await supabase.from("briefing_link_access_logs").insert({
        briefing_link_id: linkData.id,
        user_agent: navigator.userAgent,
      });

      // Update access count using security definer function (bypasses RLS)
      await supabase.rpc('increment_briefing_link_access', { _link_id: linkData.id });

      // Load checklist items
      const { data: items } = await supabase
        .from("briefing_checklist_items")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (items) {
        setChecklistItems(items as ChecklistItem[]);
        // Initialize responses
        const initialResponses: Record<string, ChecklistResponse> = {};
        items.forEach(item => {
          initialResponses[item.id] = {
            item_id: item.id,
            decision: "approved",
            comment: ""
          };
        });
        setResponses(initialResponses);
      }

      // Load briefing content
      const { data: content } = await supabase
        .from("briefing_content")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (content) {
        const contentMap: Record<string, BriefingContent> = {};
        content.forEach(c => {
          contentMap[c.section_key] = c as unknown as BriefingContent;
        });
        setBriefingContent(contentMap);
      }

    } catch (error) {
      console.error("Error validating token:", error);
      setValidToken(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (itemId: string, field: "decision" | "comment", value: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (status: "approved" | "changes_requested") => {
    if (!approverName.trim() || !approverEmail.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu nome e e-mail.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Prepare responses array for the RPC function
      const responsesArray = Object.values(responses).map(r => ({
        checklist_item_id: r.item_id,
        is_checked: r.decision === "approved"
      }));

      // Use security definer function to submit approval (bypasses RLS)
      const { error: rpcError } = await supabase.rpc('submit_briefing_approval', {
        _link_id: linkData?.id || "",
        _client_name: approverName,
        _client_email: approverEmail,
        _ip: "",
        _user_agent: navigator.userAgent,
        _signature: finalNotes || "",
        _responses: responsesArray
      });

      if (rpcError) throw rpcError;

      setSubmitted(true);
      toast({
        title: status === "approved" ? "Sistema aprovado!" : "Solicitação enviada!",
        description: "Recebemos sua resposta. Obrigado!",
      });

    } catch (error) {
      console.error("Error submitting:", error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link inválido ou expirado</h2>
            <p className="text-muted-foreground">
              Este link de briefing não é mais válido. Por favor, solicite um novo link ao responsável pelo projeto.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Recebido — Obrigado!</h2>
            <p className="text-muted-foreground">
              Sua resposta foi registrada com sucesso. Entraremos em contato em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const headerContent = briefingContent.header?.content as { version?: string; responsible?: string; contact?: string } | undefined;
  const overviewContent = briefingContent.overview?.content as { objective?: string; deliverables?: string[] } | undefined;
  const sitemapContent = briefingContent.sitemap?.content as { public?: Array<{ path: string; name: string }>; protected?: Array<{ path: string; name: string }> } | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 print:bg-white">
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { font-size: 12px; }
          .print-header { position: running(header); }
        }
        @page {
          margin: 2cm;
          @top-center {
            content: "Briefing Psicoavaliar - Versão ${headerContent?.version || '1.0'}";
          }
        }
      `}</style>

      {/* Navigation - Fixed */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b no-print">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <ScrollArea className="w-full">
            <div className="flex items-center gap-2 pb-2">
              {[
                { id: "overview", label: "Visão Geral" },
                { id: "updates", label: "🆕 Atualizações" },
                { id: "sitemap", label: "Estrutura" },
                { id: "modules", label: "Módulos" },
                { id: "admin", label: "Admin" },
                { id: "client-portal", label: "Portal Cliente" },
                { id: "scheduling", label: "Agendamentos" },
                { id: "payments", label: "Pagamentos" },
                { id: "emails", label: "E-mails" },
                { id: "blog", label: "Blog" },
                { id: "meet", label: "Google Meet" },
                { id: "lgpd", label: "LGPD" },
                { id: "checklist", label: "Checklist" },
                { id: "approval", label: "Aprovação" },
              ].map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </Button>
              ))}
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </ScrollArea>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <Badge variant="outline" className="mb-2">Documento de Aprovação</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Briefing de Aprovação
          </h1>
          <p className="text-xl text-primary font-medium">
            Centro de Psicologia Psicoavaliar
          </p>
          <p className="text-muted-foreground">
            Resumo do sistema entregue para validação do cliente
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Versão {headerContent?.version || "1.0"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>{headerContent?.responsible || "Equipe Psicoavaliar"}</span>
            </div>
          </div>
        </header>

        {/* Overview Section */}
        <section id="overview" className="print-break">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Objetivo do Sistema</h4>
                <p className="text-muted-foreground">
                  {overviewContent?.objective || "Sistema completo para gestão de clínica de psicologia, incluindo site institucional, agendamento online, painel administrativo, blog, portal do cliente, e-mails automatizados e videochamadas."}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Principais Entregas</h4>
                <ul className="space-y-2">
                  {(overviewContent?.deliverables || [
                    "Site institucional responsivo",
                    "Sistema de agendamento online",
                    "Painel administrativo completo",
                    "Portal do cliente",
                    "Blog com CMS",
                    "E-mails automatizados",
                    "Integração Google Meet"
                  ]).map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Updates Section - NEW */}
        <section id="updates" className="print-break">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Atualizações Recentes
                <Badge variant="default" className="ml-2">Novo</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {UPDATES.map((update, i) => (
                <div key={i} className="p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className="font-mono">{update.date}</Badge>
                    <Badge>{update.category}</Badge>
                  </div>
                  <ul className="space-y-2">
                    {update.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Sitemap Section */}
        <section id="sitemap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Mapa do Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    Páginas Públicas
                  </h4>
                  <ul className="space-y-1">
                    {(sitemapContent?.public || [
                      { path: "/", name: "Home" },
                      { path: "/quem-somos", name: "Quem Somos" },
                      { path: "/especialidades", name: "Especialidades" },
                      { path: "/assinaturas", name: "Planos" },
                      { path: "/faq", name: "FAQ" },
                      { path: "/contato", name: "Contato" },
                      { path: "/agendar", name: "Agendar" },
                      { path: "/blog", name: "Blog" },
                    ]).map((page, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <code className="text-xs bg-muted px-1 rounded">{page.path}</code>
                        <span>{page.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-500" />
                    Áreas Protegidas
                  </h4>
                  <ul className="space-y-1">
                    {(sitemapContent?.protected || [
                      { path: "/admin/**", name: "Painel Administrativo" },
                      { path: "/cliente/**", name: "Portal do Cliente" },
                    ]).map((page, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <code className="text-xs bg-muted px-1 rounded">{page.path}</code>
                        <span>{page.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Modules Section */}
        <section id="modules" className="print-break">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Módulos do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-semibold">Módulo</th>
                      <th className="text-left py-3 px-2 font-semibold">Descrição</th>
                      <th className="text-center py-3 px-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((module, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 px-2 font-medium">{module.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{module.description}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={module.status === "Pronto" ? "default" : "secondary"}>
                            {module.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Admin Section */}
        <section id="admin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Painel Administrativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Papéis e Permissões</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {ADMIN_ROLES.map((role, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <Badge className="mb-2">{role.role}</Badge>
                      <p className="text-sm text-muted-foreground">{role.access}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Menus Disponíveis</h4>
                <div className="flex flex-wrap gap-2">
                  {["Dashboard", "Site/CMS", "Blog", "Serviços & Planos", "Profissionais", "Agenda", "Consultas", "Clientes", "E-mails/SMTP", "Mídia", "Configurações", "Integrações"].map((menu, i) => (
                    <Badge key={i} variant="outline">{menu}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Client Portal Section */}
        <section id="client-portal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Portal do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Visualização de Consultas</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Próximas consultas agendadas</li>
                    <li>• Histórico de atendimentos</li>
                    <li>• Detalhes e código de cada consulta</li>
                    <li>• Link da videochamada (quando online)</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Ações Disponíveis</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Solicitar remarcação</li>
                    <li>• Solicitar cancelamento</li>
                    <li>• Editar dados pessoais</li>
                    <li>• Atualizar preferências</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Scheduling Section */}
        <section id="scheduling" className="print-break">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Fluxo de Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SCHEDULING_FLOW.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                    <div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div>
                <h4 className="font-semibold mb-3">Status de Consultas</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Pendente</Badge>
                  <Badge variant="default">Confirmada</Badge>
                  <Badge variant="outline">Remarcada</Badge>
                  <Badge variant="destructive">Cancelada</Badge>
                  <Badge className="bg-green-500">Concluída</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Payments Section - NEW */}
        <section id="payments">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Sistema de Pagamentos
                <Badge variant="default" className="ml-2">Novo</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Métodos Disponíveis</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span><strong>Pix</strong> - QR Code e código copia-e-cola</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span><strong>Cartão de Crédito</strong> - Checkout seguro via Appmax</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span><strong>Boleto Bancário</strong> - Geração automática</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Recursos</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Modo de teste sem credenciais (simulação)</li>
                    <li>• Animações de processamento e confirmação</li>
                    <li>• Webhooks para confirmação automática</li>
                    <li>• Status: Criado → Pendente → Pago</li>
                    <li>• Confirmação automática do agendamento</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Gateway Integrado</h4>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-lg px-4 py-1">Appmax</Badge>
                    <span className="text-sm text-muted-foreground">
                      Gateway de pagamentos brasileiro com suporte completo a Pix, Cartão e Boleto
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Emails Section */}
        <section id="emails">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                E-mails & SMTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">Configuração</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Configuração SMTP no admin</li>
                    <li>• Teste de envio integrado</li>
                    <li>• Templates editáveis com variáveis</li>
                    <li>• Logs de todos os envios</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Eventos de Disparo</h4>
                  <ul className="space-y-1 text-sm">
                    {EMAIL_EVENTS.map((event, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-primary" />
                        {event}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Blog Section */}
        <section id="blog">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Blog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Gestão de Posts</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Criar e editar posts</li>
                    <li>• Rascunho / Publicado / Agendado</li>
                    <li>• Imagem de capa via upload ou IA</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Organização</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Categorias</li>
                    <li>• Tags</li>
                    <li>• Galeria de imagens</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">SEO</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Título SEO por post</li>
                    <li>• Meta descrição</li>
                    <li>• Imagem OG para redes sociais</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Google Meet Section */}
        <section id="meet" className="print-break">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Google Meet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <Badge className="mb-2">Modo 1 - Manual</Badge>
                  <h4 className="font-semibold mb-2">Link Manual (Ativo)</h4>
                  <p className="text-sm text-muted-foreground">
                    O administrador cola o link do Google Meet na consulta. O cliente visualiza o link no portal e nos e-mails.
                  </p>
                </div>
                <div className="p-4 border rounded-lg opacity-60">
                  <Badge variant="outline" className="mb-2">Modo 2 - Automático</Badge>
                  <h4 className="font-semibold mb-2">Integração Google (Opcional)</h4>
                  <p className="text-sm text-muted-foreground">
                    Estrutura preparada para geração automática de links via API do Google Calendar. Requer configuração adicional.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Como o cliente acessa</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Botão "Entrar na videochamada" no portal do cliente</li>
                  <li>• Link incluído nos e-mails de confirmação e lembrete</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* LGPD Section */}
        <section id="lgpd">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                LGPD & Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">Conformidade LGPD</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Consentimento no cadastro e agendamento
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Política de Privacidade
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Termos de Uso
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Aviso de cookies
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Segurança</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Proteção de rotas por autenticação
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Controle de acesso por papel (RBAC)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Logs de auditoria
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Rate limiting em autenticação
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Checklist Section */}
        <section id="checklist" className="print-break no-print">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Checklist de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Por favor, avalie cada item e adicione comentários se necessário.
              </p>
              
              <div className="space-y-6">
                {checklistItems.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-4">
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    
                    <RadioGroup
                      value={responses[item.id]?.decision || "approved"}
                      onValueChange={(value) => handleResponseChange(item.id, "decision", value)}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="approved" id={`${item.id}-approved`} />
                        <Label htmlFor={`${item.id}-approved`} className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Aprovado
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="adjust" id={`${item.id}-adjust`} />
                        <Label htmlFor={`${item.id}-adjust`} className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-amber-500" />
                          Ajustar
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="na" id={`${item.id}-na`} />
                        <Label htmlFor={`${item.id}-na`} className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Não aplicável
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-2" />
                      <Input
                        placeholder="Comentário (opcional)"
                        value={responses[item.id]?.comment || ""}
                        onChange={(e) => handleResponseChange(item.id, "comment", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Approval Section */}
        <section id="approval" className="no-print">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Aprovação Final
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="approver-name">Nome do aprovador *</Label>
                  <Input
                    id="approver-name"
                    placeholder="Seu nome completo"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approver-email">E-mail *</Label>
                  <Input
                    id="approver-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={approverEmail}
                    onChange={(e) => setApproverEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="final-notes">Observações finais</Label>
                <Textarea
                  id="final-notes"
                  placeholder="Adicione qualquer observação ou comentário adicional..."
                  value={finalNotes}
                  onChange={(e) => setFinalNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => handleSubmit("approved")}
                  disabled={submitting}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Aprovar Sistema
                </Button>
                <Button
                  onClick={() => handleSubmit("changes_requested")}
                  disabled={submitting}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Solicitar Ajustes
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Psicoavaliar. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  );
}
