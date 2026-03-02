import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Mail, Info } from "lucide-react";
import { toast } from "sonner";
import EmailVisualEditor from "@/components/admin/email-editor/EmailVisualEditor";

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  html_body: string;
  variables: string[] | null;
  is_active: boolean;
}

const availableVariables = [
  { key: "{{cliente_nome}}", desc: "Nome do cliente" },
  { key: "{{servico_nome}}", desc: "Nome do serviço" },
  { key: "{{data}}", desc: "Data da consulta" },
  { key: "{{hora}}", desc: "Horário da consulta" },
  { key: "{{modalidade}}", desc: "Presencial ou Online" },
  { key: "{{codigo_consulta}}", desc: "Código único da consulta" },
  { key: "{{profissional}}", desc: "Nome do profissional" },
  { key: "{{endereco}}", desc: "Endereço da clínica" },
  { key: "{{link_online}}", desc: "Link da reunião online" },
  { key: "{{whatsapp}}", desc: "Número do WhatsApp" },
];

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editorMode, setEditorMode] = useState<"visual" | "code" | "preview">("visual");
  const [formData, setFormData] = useState({
    subject: "",
    html_content: "",
    is_active: true,
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!editingTemplate) return;
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: data.subject,
          html_body: data.html_content,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTemplate.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template atualizado!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao salvar template");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ subject: "", html_content: "", is_active: true });
    setEditorMode("visual");
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      subject: template.subject,
      html_content: template.html_body,
      is_active: template.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Preview with sample data
  const getPreviewHtml = () => {
    let preview = formData.html_content;
    const sampleData: Record<string, string> = {
      "{{cliente_nome}}": "Maria Silva",
      "{{servico_nome}}": "Avaliação Psicológica",
      "{{data}}": "20/01/2026",
      "{{hora}}": "14:00",
      "{{modalidade}}": "Presencial",
      "{{codigo_consulta}}": "PSI-2026-001",
      "{{profissional}}": "Dra. Ana Santos",
      "{{endereco}}": "Rua João Salomoni, 650 - Vila Nova, Porto Alegre",
      "{{link_online}}": "https://meet.google.com/abc-defg-hij",
      "{{whatsapp}}": "(51) 99280-9471",
    };
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return preview;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-2">Templates de E-mail</h1>
        <p className="text-muted-foreground">Personalize os e-mails enviados pelo sistema</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="py-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <CardTitle className="text-base">Variáveis Disponíveis</CardTitle>
              <CardDescription className="mt-1">
                Use estas variáveis nos templates e elas serão substituídas automaticamente:
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                {availableVariables.map((v) => (
                  <Badge 
                    key={v.key} 
                    variant="secondary" 
                    className="font-mono text-xs cursor-help"
                    title={v.desc}
                  >
                    {v.key}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-4">
          {templates?.map((template) => (
            <Card key={template.id} className={!template.is_active ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">{template.name}</h3>
                      {!template.is_active && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Assunto:</strong> {template.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Chave: <code className="bg-muted px-1 rounded">{template.slug}</code>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                    <Edit className="w-4 h-4 mr-1" /> Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Editar Template: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 flex-shrink-0">
              <div className="space-y-2">
                <Label>Assunto do E-mail</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>Template Ativo</Label>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <EmailVisualEditor
                htmlContent={formData.html_content}
                onChange={(html) => setFormData({ ...formData, html_content: html })}
                variables={availableVariables}
                onSave={() => saveMutation.mutate(formData)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium text-white" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
