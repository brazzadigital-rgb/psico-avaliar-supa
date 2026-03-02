import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Link2, 
  Copy, 
  Check, 
  Clock, 
  Trash2, 
  Eye, 
  RefreshCw,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Shield,
  BarChart3
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BriefingLink {
  id: string;
  token: string;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
  access_count: number;
  last_accessed_at: string | null;
  created_by_user_id: string | null;
}

interface BriefingApproval {
  id: string;
  token: string;
  approver_name: string;
  approver_email: string;
  status: "approved" | "changes_requested";
  notes: string | null;
  created_at: string;
}

interface ChecklistResponse {
  id: string;
  decision: "approved" | "adjust" | "na";
  comment: string | null;
  item: {
    title: string;
    key: string;
  };
}

interface AccessLog {
  id: string;
  accessed_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export default function BriefingAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Public domain used for client-facing briefing links
  const publicBriefingBaseUrl = "https://avaliar.packmasterlegacy.net";

  const [links, setLinks] = useState<BriefingLink[]>([]);
  const [approvals, setApprovals] = useState<BriefingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>("7");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [selectedApproval, setSelectedApproval] = useState<BriefingApproval | null>(null);
  const [approvalResponses, setApprovalResponses] = useState<ChecklistResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const [selectedLink, setSelectedLink] = useState<BriefingLink | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [linksRes, approvalsRes] = await Promise.all([
        supabase
          .from("briefing_links")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("briefing_approvals")
          .select("*")
          .order("created_at", { ascending: false })
      ]);

      if (linksRes.data) setLinks(linksRes.data);
      if (approvalsRes.data) setApprovals(approvalsRes.data as BriefingApproval[]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    setGenerating(true);
    try {
      // Generate a secure token
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

      const expiresAt = expirationDays === "never" 
        ? null 
        : new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from("briefing_links")
        .insert({
          token,
          expires_at: expiresAt,
          created_by_user_id: user?.id,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Link gerado!",
        description: "O link de briefing foi criado com sucesso.",
      });

      loadData();
    } catch (error) {
      console.error("Error generating link:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o link.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleLinkStatus = async (link: BriefingLink) => {
    try {
      const { error } = await supabase
        .from("briefing_links")
        .update({ is_active: !link.is_active })
        .eq("id", link.id);

      if (error) throw error;

      toast({
        title: link.is_active ? "Link desativado" : "Link reativado",
      });

      loadData();
    } catch (error) {
      console.error("Error toggling link:", error);
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from("briefing_links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Link excluído",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  };

  const copyLink = (token: string) => {
    const url = `${publicBriefingBaseUrl}/briefing?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const viewApprovalDetails = async (approval: BriefingApproval) => {
    setSelectedApproval(approval);
    setLoadingResponses(true);
    
    try {
      const { data } = await supabase
        .from("briefing_checklist_responses")
        .select(`
          id,
          decision,
          comment,
          item:briefing_checklist_items(title, key)
        `)
        .eq("approval_id", approval.id);

      if (data) {
        setApprovalResponses(data as unknown as ChecklistResponse[]);
      }
    } catch (error) {
      console.error("Error loading responses:", error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const viewAccessLogs = async (link: BriefingLink) => {
    setSelectedLink(link);
    setLoadingLogs(true);

    try {
      const { data } = await supabase
        .from("briefing_link_access_logs")
        .select("*")
        .eq("link_id", link.id)
        .order("accessed_at", { ascending: false })
        .limit(50);

      if (data) {
        setAccessLogs(data);
      }
    } catch (error) {
      console.error("Error loading access logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getStatusBadge = (link: BriefingLink) => {
    if (!link.is_active) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Briefing & Aprovação</h1>
        <p className="text-muted-foreground">
          Gerencie links de briefing e visualize aprovações dos clientes.
        </p>
      </div>

      <Tabs defaultValue="links">
        <TabsList>
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="h-4 w-4" />
            Links
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Aprovações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-6">
          {/* Generate Link Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Gerar Link de Briefing
              </CardTitle>
              <CardDescription>
                Crie um link compartilhável para o cliente visualizar e aprovar o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select value={expirationDays} onValueChange={setExpirationDays}>
                    <SelectTrigger>
                      <SelectValue placeholder="Validade do link" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Expira em 1 dia</SelectItem>
                      <SelectItem value="3">Expira em 3 dias</SelectItem>
                      <SelectItem value="7">Expira em 7 dias</SelectItem>
                      <SelectItem value="14">Expira em 14 dias</SelectItem>
                      <SelectItem value="30">Expira em 30 dias</SelectItem>
                      <SelectItem value="never">Sem expiração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={generateLink} disabled={generating}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Gerar Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Links Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Links Gerados</CardTitle>
              <Button variant="ghost" size="icon" onClick={loadData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : links.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum link gerado ainda.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead>Acessos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>{getStatusBadge(link)}</TableCell>
                          <TableCell>{formatDate(link.created_at)}</TableCell>
                          <TableCell>
                            {link.expires_at ? formatDate(link.expires_at) : "Nunca"}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              {link.access_count}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyLink(link.token)}
                              >
                                {copiedToken === link.token ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                 onClick={() => window.open(`${publicBriefingBaseUrl}/briefing?token=${link.token}`, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewAccessLogs(link)}
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleLinkStatus(link)}
                              >
                                {link.is_active ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteLink(link.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Aprovações</CardTitle>
              <CardDescription>
                Visualize todas as respostas enviadas pelos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : approvals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma aprovação recebida ainda.
                </p>
              ) : (
                <div className="space-y-4">
                  {approvals.map((approval) => (
                    <Card key={approval.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => viewApprovalDetails(approval)}>
                      <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{approval.approver_name}</span>
                              <Badge variant={approval.status === "approved" ? "default" : "secondary"}>
                                {approval.status === "approved" ? "Aprovado" : "Ajustes solicitados"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{approval.approver_email}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(approval.created_at)}
                          </div>
                        </div>
                        {approval.notes && (
                          <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="text-sm">{approval.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Details Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Aprovação</DialogTitle>
            <DialogDescription>
              Respostas do checklist enviadas por {selectedApproval?.approver_name}
            </DialogDescription>
          </DialogHeader>

          {loadingResponses ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {approvalResponses.map((response) => (
                <div key={response.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium">{response.item?.title || "Item"}</h4>
                      {response.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{response.comment}</p>
                      )}
                    </div>
                    <Badge variant={
                      response.decision === "approved" ? "default" :
                      response.decision === "adjust" ? "destructive" : "secondary"
                    }>
                      {response.decision === "approved" ? "Aprovado" :
                       response.decision === "adjust" ? "Ajustar" : "N/A"}
                    </Badge>
                  </div>
                </div>
              ))}

              {selectedApproval?.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Observações finais</h4>
                    <p className="text-sm text-muted-foreground">{selectedApproval.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Access Logs Dialog */}
      <Dialog open={!!selectedLink} onOpenChange={() => setSelectedLink(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs de Acesso</DialogTitle>
            <DialogDescription>
              Histórico de acessos a este link de briefing
            </DialogDescription>
          </DialogHeader>

          {loadingLogs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : accessLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum acesso registrado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {accessLogs.map((log) => (
                <div key={log.id} className="p-3 border rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatDate(log.accessed_at)}</span>
                    {log.ip_address && (
                      <span className="text-muted-foreground">{log.ip_address}</span>
                    )}
                  </div>
                  {log.user_agent && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {log.user_agent}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
