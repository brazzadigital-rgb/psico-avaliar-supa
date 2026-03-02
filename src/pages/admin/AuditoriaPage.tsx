import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileSearch, 
  Search, 
  Loader2,
  User,
  Calendar,
  Settings,
  Shield,
  FileText,
  Mail,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  created_at: string;
}

export default function AuditoriaPage() {
  const { hasPermission } = usePermissions();
  
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7d");

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "1d": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "all": return new Date(0);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", dateFilter],
    queryFn: async () => {
      const startDate = getDateRange();
      
      let query = supabase
        .from("audit_logs")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    }
  });

  // Filter logs
  const filteredLogs = logs?.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = entityTypeFilter === "all" || log.entity_type === entityTypeFilter;
    
    return matchesSearch && matchesType;
  }) || [];

  // Get unique entity types
  const entityTypes = [...new Set(logs?.map(l => l.entity_type) || [])];

  // Get icon for entity type
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'settings': return <Settings className="w-4 h-4" />;
      case 'role_permission': return <Shield className="w-4 h-4" />;
      case 'blog': return <FileText className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'client': return <Users className="w-4 h-4" />;
      default: return <FileSearch className="w-4 h-4" />;
    }
  };

  // Get action badge color
  const getActionColor = (action: string) => {
    if (action.includes('created') || action.includes('added')) {
      return 'bg-green-500/10 text-green-600 border-green-200';
    }
    if (action.includes('deleted') || action.includes('removed') || action.includes('deactivated')) {
      return 'bg-red-500/10 text-red-600 border-red-200';
    }
    if (action.includes('updated') || action.includes('changed')) {
      return 'bg-blue-500/10 text-blue-600 border-blue-200';
    }
    return 'bg-gray-500/10 text-gray-600 border-gray-200';
  };

  // Format action for display
  const formatAction = (action: string) => {
    return action
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Auditoria</h1>
        <p className="text-muted-foreground mt-1">
          Histórico de ações realizadas no sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileSearch className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{logs?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total de logs</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {logs?.filter(l => l.entity_type === 'user').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Usuários</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {logs?.filter(l => l.entity_type === 'appointment').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Consultas</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {logs?.filter(l => l.entity_type === 'role_permission').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Permissões</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ação, tipo ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Último dia</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden md:table-cell">ID do Recurso</TableHead>
              <TableHead className="hidden lg:table-cell">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm">
                      {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getActionColor(log.action)}>
                      {formatAction(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEntityIcon(log.entity_type)}
                      <span className="capitalize">{log.entity_type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {log.entity_id ? (
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {log.entity_id.substring(0, 8)}...
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {log.new_values ? (
                      <code className="text-xs bg-muted px-2 py-0.5 rounded max-w-xs truncate block">
                        {JSON.stringify(log.new_values).substring(0, 50)}...
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Exibindo {filteredLogs.length} de {logs?.length || 0} registros
      </div>
    </div>
  );
}
