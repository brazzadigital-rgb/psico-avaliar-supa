import { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Type,
  Link,
  Image,
  Undo,
  Redo,
  Save,
  Monitor,
  Smartphone,
  Copy,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface EmailVisualEditorProps {
  htmlContent: string;
  onChange: (html: string) => void;
  variables: { key: string; desc: string }[];
  onSave?: () => void;
}

export default function EmailVisualEditor({
  htmlContent,
  onChange,
  variables,
  onSave,
}: EmailVisualEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorMode, setEditorMode] = useState<"visual" | "code">("visual");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [initialContent, setInitialContent] = useState(htmlContent);

  // Extract body content from full HTML for editing
  const extractBodyContent = useCallback((html: string) => {
    const match = html.match(/<td[^>]*style="[^"]*padding[^"]*"[^>]*>([\s\S]*?)<\/td>\s*<\/tr>\s*<!--\s*Footer/i);
    if (match) return match[1];
    
    // Try to find content between header and footer
    const bodyMatch = html.match(/<!-- Content -->\s*<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>\s*<!-- Footer/i);
    if (bodyMatch) return bodyMatch[1];
    
    // Fallback: return as is or create basic structure
    if (html.includes("<body")) {
      const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      return bodyContent ? bodyContent[1] : html;
    }
    
    return html || `<h2 style="color: #0d9488; font-size: 24px; margin-bottom: 16px;">Olá, {{cliente_nome}}!</h2>
<p style="font-size: 16px; color: #374151; line-height: 1.6;">Seu conteúdo aqui...</p>`;
  }, []);

  // Wrap body content in full email template
  const wrapInTemplate = useCallback((bodyContent: string) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Psicoavaliar</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Psicoavaliar - Rua João Salomoni, 650 - Vila Nova, Porto Alegre<br>
                <a href="https://wa.me/5551992809471" style="color: #0d9488;">WhatsApp: {{whatsapp}}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }, []);

  const [bodyContent, setBodyContent] = useState(() => extractBodyContent(htmlContent));

  useEffect(() => {
    if (editorRef.current && editorMode === "visual") {
      editorRef.current.innerHTML = bodyContent;
    }
  }, [editorMode]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setBodyContent(newContent);
      onChange(wrapInTemplate(newContent));
    }
  }, [onChange, wrapInTemplate]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  }, [handleContentChange]);

  const insertVariable = useCallback((variable: string) => {
    const selection = window.getSelection();
    if (selection && editorRef.current) {
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.color = "#0d9488";
        span.style.fontWeight = "600";
        span.textContent = variable;
        range.deleteContents();
        range.insertNode(span);
        range.setStartAfter(span);
        range.setEndAfter(span);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += `<span style="color: #0d9488; font-weight: 600;">${variable}</span>`;
      }
      handleContentChange();
    }
  }, [handleContentChange]);

  const insertLink = useCallback(() => {
    const url = prompt("Digite a URL do link:", "https://");
    if (url) {
      execCommand("createLink", url);
    }
  }, [execCommand]);

  const handleRestore = useCallback(() => {
    setBodyContent(extractBodyContent(initialContent));
    if (editorRef.current) {
      editorRef.current.innerHTML = extractBodyContent(initialContent);
    }
    onChange(initialContent);
    toast.success("Conteúdo restaurado!");
  }, [initialContent, extractBodyContent, onChange]);

  const handleCopyHtml = useCallback(() => {
    navigator.clipboard.writeText(wrapInTemplate(bodyContent));
    toast.success("HTML copiado!");
  }, [bodyContent, wrapInTemplate]);

  // Preview with sample data
  const getPreviewHtml = useCallback(() => {
    let preview = wrapInTemplate(bodyContent);
    const sampleData: Record<string, string> = {
      "{{cliente_nome}}": "João Silva",
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
  }, [bodyContent, wrapInTemplate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Side - Editor */}
      <div className="flex flex-col space-y-4">
        {/* Tabs Visual/Código */}
        <div className="flex items-center justify-between">
          <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as any)} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="visual" className="gap-2 px-4">
                <Type className="w-4 h-4" /> Visual
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-2 px-4">
                {"</>"} Código
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestore}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Restaurar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyHtml}
              className="gap-2"
            >
              <Copy className="w-4 h-4" /> Copiar HTML
            </Button>
          </div>
        </div>

        {editorMode === "visual" ? (
          <>
            {/* Toolbar */}
            <div className="border rounded-lg bg-muted/30 p-2 flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("bold")}
                title="Negrito"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("italic")}
                title="Itálico"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("underline")}
                title="Sublinhado"
              >
                <Underline className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("justifyLeft")}
                title="Alinhar à esquerda"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("justifyCenter")}
                title="Centralizar"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("justifyRight")}
                title="Alinhar à direita"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("justifyFull")}
                title="Justificar"
              >
                <AlignJustify className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("insertUnorderedList")}
                title="Lista com marcadores"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("insertOrderedList")}
                title="Lista numerada"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("formatBlock", "<h2>")}
                title="Título"
              >
                <Type className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={insertLink}
                title="Inserir link"
              >
                <Link className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("undo")}
                title="Desfazer"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("redo")}
                title="Refazer"
              >
                <Redo className="w-4 h-4" />
              </Button>

              <div className="flex-1" />

              {onSave && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onSave}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Save className="w-4 h-4" /> Salvar
                </Button>
              )}
            </div>

            {/* WYSIWYG Editor */}
            <div
              ref={editorRef}
              contentEditable
              className="border rounded-lg bg-white p-6 min-h-[350px] max-h-[400px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-primary/20 prose prose-sm max-w-none"
              onInput={handleContentChange}
              onBlur={handleContentChange}
              dangerouslySetInnerHTML={{ __html: bodyContent }}
              style={{
                color: "#374151",
                lineHeight: 1.6,
              }}
            />

            <p className="text-xs text-muted-foreground">
              Clique no texto para editar. Use a barra de ferramentas para formatar e inserir elementos.
            </p>
          </>
        ) : (
          /* Code Editor */
          <textarea
            value={bodyContent}
            onChange={(e) => {
              setBodyContent(e.target.value);
              onChange(wrapInTemplate(e.target.value));
            }}
            className="border rounded-lg p-4 font-mono text-sm min-h-[400px] max-h-[450px] resize-none bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            spellCheck={false}
          />
        )}

        {/* Placeholders */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Placeholders:</Label>
          <div className="flex flex-wrap gap-2">
            {variables.map((v) => (
              <Badge
                key={v.key}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors font-mono text-xs"
                onClick={() => insertVariable(v.key)}
                title={v.desc}
              >
                {v.key}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Preview */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-medium">Pré-visualização</Label>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              type="button"
              variant={previewMode === "desktop" ? "default" : "ghost"}
              size="sm"
              className="rounded-none gap-2"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="w-4 h-4" /> Desktop
            </Button>
            <Button
              type="button"
              variant={previewMode === "mobile" ? "default" : "ghost"}
              size="sm"
              className="rounded-none gap-2"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="w-4 h-4" /> Mobile
            </Button>
          </div>
        </div>

        <div className="border rounded-lg bg-muted/30 p-4 flex-1 flex items-start justify-center overflow-auto">
          <div
            className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
              previewMode === "mobile" ? "w-[375px]" : "w-full max-w-[600px]"
            }`}
          >
            <iframe
              srcDoc={getPreviewHtml()}
              className="w-full h-[500px] border-0"
              title="Preview do e-mail"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
