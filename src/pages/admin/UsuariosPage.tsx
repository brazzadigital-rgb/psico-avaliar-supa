import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions";
import { useAuditLog, AUDIT_ACTIONS } from "@/hooks/useAuditLog";
import { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { 
  UserPlus, 
  Search, 
  Mail, 
  Shield, 
  UserCog, 
  MoreVertical,
  Eye,
  Edit,
  Power,
  Key,
  Send,
  Loader2,
  Plus
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  user_metadata: {
    full_name?: string;
  };
  role: AppRole | null;
}

export default function UsuariosPage() {
  const { hasPermission } = usePermissions();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("receptionist");
  const [newRole, setNewRole] = useState<AppRole>("client");
  
  // Create user form state
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createRole, setCreateRole] = useState<AppRole>("client");

  // Fetch users with roles (only authenticated users who have a user_id)
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Get clients WITH user_id (authenticated clients only)
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("user_id, full_name, email, created_at")
        .not("user_id", "is", null);

      if (clientsError) throw clientsError;

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, created_at");

      if (profilesError) throw profilesError;

      // Get professionals with user_id
      const { data: professionals, error: professionalsError } = await supabase
        .from("professionals")
        .select("user_id, name, email, created_at")
        .not("user_id", "is", null);

      if (professionalsError) throw professionalsError;

      // Combine data - prioritize highest-privilege role per user
      const rolePriority: Record<string, number> = { admin: 0, receptionist: 1, professional: 2, client: 3 };
      const roleMap = new Map<string, AppRole>();
      for (const r of (roles || [])) {
        const existing = roleMap.get(r.user_id);
        if (!existing || (rolePriority[r.role] ?? 99) < (rolePriority[existing] ?? 99)) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      }
      const clientMap = new Map(clients?.map(c => [c.user_id, c]) || []);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const professionalMap = new Map(professionals?.map(p => [p.user_id, p]) || []);

      // Get unique user IDs from all authenticated sources
      const userIds = new Set([
        ...roles?.map(r => r.user_id) || [],
        ...clients?.map(c => c.user_id!) || [],
        ...profiles?.map(p => p.user_id) || [],
        ...professionals?.map(p => p.user_id!) || []
      ]);

      const usersData: UserWithRole[] = Array.from(userIds).map(userId => {
        const client = clientMap.get(userId);
        const profile = profileMap.get(userId);
        const professional = professionalMap.get(userId);
        const role = roleMap.get(userId) || null;

        // Get the best name available: client > professional > profile
        const fullName = client?.full_name || professional?.name || profile?.full_name || undefined;
        
        // Get the best email available: client > professional
        const email = client?.email || professional?.email || 'N/A';

        return {
          id: userId,
          email,
          created_at: client?.created_at || professional?.created_at || profile?.created_at || new Date().toISOString(),
          last_sign_in_at: null,
          user_metadata: {
            full_name: fullName
          },
          role
        };
      });

      return usersData;
    }
  });

  // Filter users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.user_metadata.full_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: async (_, { userId, role }) => {
      await logAction({
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        entityType: 'user',
        entityId: userId,
        newValues: { role }
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role atualizada com sucesso!");
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar role");
    }
  });

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      // Generate token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes, b => b.toString(16).padStart(2, '0')).join('');
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from("invites")
        .insert({
          email,
          role,
          token_hash: token,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;
      
      // Send invite email via edge function
      const { data: userData } = await supabase.auth.getUser();
      const inviterName = userData?.user?.user_metadata?.full_name || userData?.user?.email;

      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          email,
          role,
          token,
          invitedBy: inviterName
        }
      });

      if (emailError) {
        console.error("Email error:", emailError);
        // Still return success - invite was created, email just failed
        return { token, emailSent: false, emailError: emailError.message };
      }

      if (emailResult?.error) {
        return { token, emailSent: false, emailError: emailResult.error };
      }

      return { token, emailSent: true };
    },
    onSuccess: async (result, { email, role }) => {
      await logAction({
        action: AUDIT_ACTIONS.USER_INVITED,
        entityType: 'invite',
        newValues: { email, role }
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      
      if (result.emailSent) {
        toast.success("Convite enviado por e-mail com sucesso!");
      } else {
        toast.warning(`Convite criado, mas e-mail não enviado: ${result.emailError || 'Configure SMTP em Configurações'}`);
      }
      
      setInviteDialogOpen(false);
      setInviteEmail("");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar convite: ${error.message}`);
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, fullName, role }: { 
      email: string; 
      password: string; 
      fullName: string;
      role: AppRole 
    }) => {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password, fullName, role }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: async (result, { email, role }) => {
      await logAction({
        action: AUDIT_ACTIONS.USER_CREATED,
        entityType: 'user',
        entityId: result.user?.id,
        newValues: { email, role }
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário criado com sucesso!");
      setCreateDialogOpen(false);
      setCreateEmail("");
      setCreatePassword("");
      setCreateFullName("");
      setCreateRole("client");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    }
  });

  const handleEditRole = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role || "client");
    setEditDialogOpen(true);
  };

  const getRoleBadgeColor = (role: AppRole | null) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'receptionist': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'professional': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'client': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários, funções e permissões
          </p>
        </div>
        
        <PermissionGuard permission="users.invite">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Usuário
            </Button>
            <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Convidar Usuário
            </Button>
          </div>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as roles</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="receptionist">Recepcionista</SelectItem>
            <SelectItem value="professional">Profissional</SelectItem>
            <SelectItem value="client">Cliente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.role === 'admin').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <UserCog className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.role === 'professional').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Profissionais</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <UserCog className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.role === 'client').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Clientes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-medium text-primary">
                          {user.user_metadata.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.user_metadata.full_name || 'Sem nome'}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {user.role ? ROLE_DISPLAY_NAMES[user.role] : 'Sem role'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <PermissionGuard permission="users.update">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRole(user)}>
                            <Shield className="w-4 h-4 mr-2" />
                            Alterar Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="w-4 h-4 mr-2" />
                            Permissões
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Send className="w-4 h-4 mr-2" />
                            Reenviar Convite
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Power className="w-4 h-4 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </PermissionGuard>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
            <DialogDescription>
              Envie um convite para um novo membro da equipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receptionist">
                    <div>
                      <div>Recepcionista</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS.receptionist}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="professional">
                    <div>
                      <div>Profissional</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS.professional}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div>
                      <div>Administrador</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS.admin}
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createInviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
              disabled={!inviteEmail || createInviteMutation.isPending}
            >
              {createInviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Role</DialogTitle>
            <DialogDescription>
              Altere a função de {selectedUser?.user_metadata.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Role</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_DISPLAY_NAMES) as AppRole[]).map((role) => (
                    <SelectItem key={role} value={role}>
                      <div>
                        <div>{ROLE_DISPLAY_NAMES[role]}</div>
                        <div className="text-xs text-muted-foreground max-w-xs">
                          {ROLE_DESCRIPTIONS[role]}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
                }
              }}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário diretamente na plataforma com e-mail e senha
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-fullname">Nome completo</Label>
              <Input
                id="create-fullname"
                type="text"
                placeholder="João Silva"
                value={createFullName}
                onChange={(e) => setCreateFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">E-mail</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="email@exemplo.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Senha</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={createRole} onValueChange={(v) => setCreateRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">
                    <div>
                      <div>Cliente</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS.client}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="receptionist">
                    <div>
                      <div>Recepcionista</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS.receptionist}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="professional">
                    <div>
                      <div>Profissional</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS.professional}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div>
                      <div>Administrador</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS.admin}
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createUserMutation.mutate({ 
                email: createEmail, 
                password: createPassword, 
                fullName: createFullName,
                role: createRole 
              })}
              disabled={!createEmail || !createPassword || createPassword.length < 6 || createUserMutation.isPending}
            >
              {createUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
