import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions";
import { useAuditLog, AUDIT_ACTIONS } from "@/hooks/useAuditLog";
import { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS, PERMISSION_CATEGORIES } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Loader2, Check, X, Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
}

interface RolePermission {
  role: AppRole;
  permission_id: string;
}

export default function RolesPage() {
  const { hasPermission } = usePermissions();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AppRole>("receptionist");

  // Fetch permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
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

  // Fetch role permissions
  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, permission_id");

      if (error) throw error;
      return data as RolePermission[];
    }
  });

  // Toggle permission mutation
  const togglePermissionMutation = useMutation({
    mutationFn: async ({ role, permissionId, hasPermission }: { 
      role: AppRole; 
      permissionId: string; 
      hasPermission: boolean 
    }) => {
      if (hasPermission) {
        // Remove permission
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role", role)
          .eq("permission_id", permissionId);
        if (error) throw error;
      } else {
        // Add permission
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role, permission_id: permissionId });
        if (error) throw error;
      }
    },
    onSuccess: async (_, { role, permissionId, hasPermission }) => {
      await logAction({
        action: hasPermission ? AUDIT_ACTIONS.ROLE_PERMISSION_REMOVED : AUDIT_ACTIONS.ROLE_PERMISSION_ADDED,
        entityType: 'role_permission',
        newValues: { role, permissionId }
      });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success(hasPermission ? "Permissão removida" : "Permissão adicionada");
    },
    onError: () => {
      toast.error("Erro ao atualizar permissão");
    }
  });

  // Group permissions by category
  const permissionsByCategory = permissions?.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>) || {};

  // Check if role has permission
  const roleHasPermission = (role: AppRole, permissionId: string) => {
    return rolePermissions?.some(rp => rp.role === role && rp.permission_id === permissionId) || false;
  };

  // Get count of permissions for role
  const getRolePermissionCount = (role: AppRole) => {
    if (role === 'admin') return permissions?.length || 0;
    return rolePermissions?.filter(rp => rp.role === role).length || 0;
  };

  const roles: AppRole[] = ['admin', 'receptionist', 'professional', 'client'];

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'receptionist': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'professional': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'client': return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const isLoading = permissionsLoading || rolePermissionsLoading;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Roles e Permissões</h1>
        <p className="text-muted-foreground mt-1">
          Configure as permissões para cada função do sistema
        </p>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card 
            key={role}
            className={`cursor-pointer transition-all ${
              selectedRole === role 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => role !== 'admin' && setSelectedRole(role)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getRoleBadgeColor(role)}>
                  {ROLE_DISPLAY_NAMES[role]}
                </Badge>
                {role === 'admin' && (
                  <Shield className="w-4 h-4 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">
                {ROLE_DESCRIPTIONS[role]}
              </div>
              <div className="text-sm font-medium">
                {role === 'admin' ? (
                  <span className="text-red-600">Todas as permissões (*)</span>
                ) : (
                  <span>{getRolePermissionCount(role)} permissões</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Editor */}
      {selectedRole !== 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permissões: {ROLE_DISPLAY_NAMES[selectedRole]}
            </CardTitle>
            <CardDescription>
              Marque as permissões que esta role deve ter acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Accordion type="multiple" defaultValue={PERMISSION_CATEGORIES.map(c => c)}>
                {PERMISSION_CATEGORIES.map((category) => {
                  const categoryPermissions = permissionsByCategory[category];
                  if (!categoryPermissions?.length) return null;
                  
                  const enabledCount = categoryPermissions.filter(p => 
                    roleHasPermission(selectedRole, p.id)
                  ).length;

                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between flex-1 mr-4">
                          <span className="font-medium">{category}</span>
                          <Badge variant="secondary">
                            {enabledCount}/{categoryPermissions.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-3 pt-2">
                          {categoryPermissions.map((permission) => {
                            const hasPermission = roleHasPermission(selectedRole, permission.id);
                            const canEdit = hasPermission ? hasPermission : true;
                            
                            return (
                              <PermissionGuard key={permission.id} permission="roles.manage">
                                <div 
                                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                    hasPermission 
                                      ? 'bg-primary/5 border-primary/20' 
                                      : 'bg-muted/30 border-transparent'
                                  }`}
                                >
                                  <Checkbox
                                    checked={hasPermission}
                                    disabled={togglePermissionMutation.isPending}
                                    onCheckedChange={() => {
                                      togglePermissionMutation.mutate({
                                        role: selectedRole,
                                        permissionId: permission.id,
                                        hasPermission
                                      });
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{permission.name}</span>
                                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                        {permission.key}
                                      </code>
                                    </div>
                                    {permission.description && (
                                      <p className="text-sm text-muted-foreground mt-0.5">
                                        {permission.description}
                                      </p>
                                    )}
                                  </div>
                                  {hasPermission ? (
                                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                                  ) : (
                                    <X className="w-4 h-4 text-muted-foreground shrink-0" />
                                  )}
                                </div>
                              </PermissionGuard>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {selectedRole === 'admin' && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-2">
              <Shield className="w-12 h-12 mx-auto text-red-500" />
              <h3 className="font-semibold">Administrador tem acesso total</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                A role de administrador possui acesso irrestrito a todas as permissões do sistema. 
                Não é possível remover permissões desta role.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
