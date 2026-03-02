import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions";
import { PERMISSION_CATEGORIES } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from "sonner";
import { Key, Search, Plus, Loader2 } from "lucide-react";

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  created_at: string;
}

export default function PermissoesPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({
    key: "",
    name: "",
    description: "",
    category: "general"
  });

  // Fetch permissions
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["permissions-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("category", { ascending: true })
        .order("key", { ascending: true });

      if (error) throw error;
      return data as Permission[];
    }
  });

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (perm: typeof newPermission) => {
      const { error } = await supabase
        .from("permissions")
        .insert({
          key: perm.key,
          name: perm.name,
          description: perm.description || null,
          category: perm.category
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions-list"] });
      toast.success("Permissão criada com sucesso!");
      setCreateDialogOpen(false);
      setNewPermission({ key: "", name: "", description: "", category: "general" });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("Já existe uma permissão com essa chave");
      } else {
        toast.error("Erro ao criar permissão");
      }
    }
  });

  // Filter permissions
  const filteredPermissions = permissions?.filter(perm => {
    const matchesSearch = 
      perm.key.toLowerCase().includes(search.toLowerCase()) ||
      perm.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || perm.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories
  const categories = [...new Set(permissions?.map(p => p.category) || [])];

  // Count by category
  const countByCategory = permissions?.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Permissões</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie todas as permissões do sistema
          </p>
        </div>
        
        <PermissionGuard permission="permissions.manage">
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Permissão
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats by category */}
      <div className="flex flex-wrap gap-2">
        {PERMISSION_CATEGORIES.map((category) => {
          const count = countByCategory[category] || 0;
          if (count === 0) return null;
          return (
            <Badge 
              key={category} 
              variant={categoryFilter === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryFilter(categoryFilter === category ? "all" : category)}
            >
              {category}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por chave ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {PERMISSION_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permissions Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chave</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead>Categoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredPermissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma permissão encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredPermissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">
                        {perm.key}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{perm.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {perm.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{perm.category}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Total: {permissions?.length || 0} permissões
      </div>

      {/* Create Permission Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Permissão</DialogTitle>
            <DialogDescription>
              Crie uma nova permissão para uso no sistema RBAC
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chave (key)</label>
              <Input
                placeholder="ex: resource.action"
                value={newPermission.key}
                onChange={(e) => setNewPermission({ ...newPermission, key: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use o formato: recurso.ação (ex: appointments.create)
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                placeholder="Nome legível da permissão"
                value={newPermission.name}
                onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descrição opcional da permissão"
                value={newPermission.description}
                onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select 
                value={newPermission.category} 
                onValueChange={(v) => setNewPermission({ ...newPermission, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createPermissionMutation.mutate(newPermission)}
              disabled={!newPermission.key || !newPermission.name || createPermissionMutation.isPending}
            >
              {createPermissionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Permissão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
