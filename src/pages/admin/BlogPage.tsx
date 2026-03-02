import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, Edit, Trash2, Search, Eye, FileText, Upload, Image, 
  Bold, Italic, Heading1, Heading2, List, Link, Quote, Code
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BlogImageUploader from "@/components/admin/BlogImageUploader";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  category_id: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  seo_title: string | null;
  seo_description: string | null;
  category?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BlogPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editorTab, setEditorTab] = useState<"content" | "seo" | "media" | "preview">("content");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    gallery_images: [] as string[],
    category_id: "",
    status: "draft",
    seo_title: "",
    seo_description: "",
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*, category:blog_categories(name)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        title: data.title,
        slug: data.slug || generateSlug(data.title),
        excerpt: data.excerpt || null,
        content: data.content || null,
        cover_image_url: data.cover_image_url || null,
        gallery_images: data.gallery_images.length > 0 ? data.gallery_images : null,
        category_id: data.category_id || null,
        status: data.status,
        seo_title: data.seo_title || null,
        seo_description: data.seo_description || null,
        published_at: data.status === "published" ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("blog_posts")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success(editingPost ? "Post atualizado!" : "Post criado!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao salvar post");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post excluído!");
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    setEditorTab("content");
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image_url: "",
      gallery_images: [],
      category_id: "",
      status: "draft",
      seo_title: "",
      seo_description: "",
    });
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content || "",
      cover_image_url: post.cover_image_url || "",
      gallery_images: post.gallery_images || [],
      category_id: post.category_id || "",
      status: post.status,
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Insert formatting into content
  const insertFormatting = (before: string, after: string = "") => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const selectedText = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    setFormData({ ...formData, content: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const filteredPosts = posts?.filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-700">Publicado</Badge>;
      case "draft":
        return <Badge variant="secondary">Rascunho</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Agendado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground">Gerencie os posts do blog</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="btn-premium text-white gap-2">
          <Plus className="w-4 h-4" />
          Novo Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="scheduled">Agendados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredPosts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum post encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts?.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.cover_image_url && (
                          <img 
                            src={post.cover_image_url} 
                            alt="" 
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-muted-foreground">/{post.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{post.category?.name || "-"}</TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(post.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {post.status === "published" && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Excluir este post?")) {
                              deleteMutation.mutate(post.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Full Page Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Editar Post" : "Novo Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
              {/* Main Content Area */}
              <div className="lg:col-span-2 flex flex-col overflow-hidden">
                <div className="space-y-4 mb-4">
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          title: e.target.value,
                          slug: formData.slug || generateSlug(e.target.value),
                        });
                      }}
                      className="text-lg font-medium"
                      placeholder="Título do post"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug (URL)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">/blog/</span>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="sera-gerado-automaticamente"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList>
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    <TabsTrigger value="media">Mídia</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="flex-1 overflow-hidden mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Resumo</Label>
                      <Textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        rows={2}
                        placeholder="Breve descrição do post (aparece na listagem)"
                      />
                    </div>

                    <div className="space-y-2 flex-1">
                      <Label>Conteúdo</Label>
                      {/* Toolbar */}
                      <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-t-lg border border-b-0">
                        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("<h2>", "</h2>")}>
                          <Heading1 className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("<h3>", "</h3>")}>
                          <Heading2 className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("<strong>", "</strong>")}>
                          <Bold className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("<em>", "</em>")}>
                          <Italic className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("<ul>\n  <li>", "</li>\n</ul>")}>
                          <List className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<a href="">', "</a>")}>
                          <Link className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("<blockquote>", "</blockquote>")}>
                          <Quote className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("<code>", "</code>")}>
                          <Code className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<img src="" alt="" class="w-full rounded-lg" />', "")}>
                          <Image className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        ref={contentRef}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="min-h-[300px] font-mono text-sm rounded-t-none"
                        placeholder="Conteúdo do post (suporta HTML)"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="mt-4 overflow-auto">
                    <BlogImageUploader
                      coverImage={formData.cover_image_url}
                      galleryImages={formData.gallery_images}
                      onCoverChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                      onGalleryChange={(urls) => setFormData({ ...formData, gallery_images: urls })}
                    />
                  </TabsContent>

                  <TabsContent value="seo" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Título SEO</Label>
                      <Input
                        value={formData.seo_title}
                        onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                        placeholder={formData.title || "Título para mecanismos de busca"}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(formData.seo_title || formData.title).length}/60 caracteres
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição SEO</Label>
                      <Textarea
                        value={formData.seo_description}
                        onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                        placeholder={formData.excerpt || "Descrição para mecanismos de busca"}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(formData.seo_description || formData.excerpt).length}/160 caracteres
                      </p>
                    </div>

                    {/* Google Preview */}
                    <div className="p-4 bg-white border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Prévia no Google:</p>
                      <div className="space-y-1">
                        <div className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                          {formData.seo_title || formData.title || "Título do Post"}
                        </div>
                        <div className="text-green-700 text-sm">
                          psicoavaliar.com.br/blog/{formData.slug || "post-slug"}
                        </div>
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {formData.seo_description || formData.excerpt || "Descrição do post aparecerá aqui..."}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-4 overflow-auto">
                    <div className="prose prose-green max-w-none">
                      {formData.cover_image_url && (
                        <img 
                          src={formData.cover_image_url} 
                          alt={formData.title}
                          className="w-full h-64 object-cover rounded-lg mb-6"
                        />
                      )}
                      <h1>{formData.title || "Título do Post"}</h1>
                      {formData.excerpt && (
                        <p className="lead text-lg text-muted-foreground">{formData.excerpt}</p>
                      )}
                      <div dangerouslySetInnerHTML={{ __html: formData.content || "<p>Comece a escrever...</p>" }} />
                      
                      {formData.gallery_images.length > 0 && (
                        <div className="mt-8">
                          <h3>Galeria</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 not-prose">
                            {formData.gallery_images.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Galeria ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="space-y-6 overflow-auto">
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Publicação</h3>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.cover_image_url && (
                  <div className="space-y-2 p-4 border rounded-lg">
                    <h3 className="font-medium">Prévia da Capa</h3>
                    <img 
                      src={formData.cover_image_url} 
                      alt="Capa" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Edite na aba "Mídia"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium text-white" disabled={saveMutation.isPending}>
                {editingPost ? "Salvar Alterações" : "Criar Post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
