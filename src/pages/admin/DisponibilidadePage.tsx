import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Clock, Calendar, Ban, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AvailabilityCalendar from "@/components/admin/AvailabilityCalendar";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

interface AvailabilityRule {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  professional?: { name: string };
}

interface TimeOffBlock {
  id: string;
  professional_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  professional?: { name: string };
}

interface Professional {
  id: string;
  name: string;
}

export default function DisponibilidadePage() {
  const queryClient = useQueryClient();
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isTimeOffDialogOpen, setIsTimeOffDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    professional_id: "",
    day_of_week: "1",
    start_time: "09:00",
    end_time: "18:00",
    is_active: true,
  });
  const [timeOffFormData, setTimeOffFormData] = useState({
    professional_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const { data: professionals } = useQuery({
    queryKey: ["professionals-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Professional[];
    },
  });

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ["availability-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_rules")
        .select("*, professional:professionals(name)")
        .order("day_of_week")
        .order("start_time");
      if (error) throw error;
      return data as AvailabilityRule[];
    },
  });

  const { data: timeOffBlocks, isLoading: timeOffLoading } = useQuery({
    queryKey: ["time-off-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off_blocks")
        .select("*, professional:professionals(name)")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as TimeOffBlock[];
    },
  });

  const saveRuleMutation = useMutation({
    mutationFn: async (data: typeof ruleFormData) => {
      const payload = {
        professional_id: data.professional_id,
        day_of_week: parseInt(data.day_of_week),
        start_time: data.start_time,
        end_time: data.end_time,
        is_active: data.is_active,
      };

      if (editingRule) {
        const { error } = await supabase
          .from("availability_rules")
          .update(payload)
          .eq("id", editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("availability_rules").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
      toast.success(editingRule ? "Regra atualizada!" : "Regra criada!");
      handleCloseRuleDialog();
    },
    onError: () => {
      toast.error("Erro ao salvar regra");
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("availability_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
      toast.success("Regra excluída!");
    },
  });

  const saveTimeOffMutation = useMutation({
    mutationFn: async (data: typeof timeOffFormData) => {
      const { error } = await supabase.from("time_off_blocks").insert([{
        professional_id: data.professional_id,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-off-blocks"] });
      toast.success("Bloqueio criado!");
      handleCloseTimeOffDialog();
    },
    onError: () => {
      toast.error("Erro ao criar bloqueio");
    },
  });

  const deleteTimeOffMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_off_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-off-blocks"] });
      toast.success("Bloqueio removido!");
    },
  });

  const handleCloseRuleDialog = () => {
    setIsRuleDialogOpen(false);
    setEditingRule(null);
    setRuleFormData({
      professional_id: "",
      day_of_week: "1",
      start_time: "09:00",
      end_time: "18:00",
      is_active: true,
    });
  };

  const handleCloseTimeOffDialog = () => {
    setIsTimeOffDialogOpen(false);
    setTimeOffFormData({
      professional_id: "",
      start_date: "",
      end_date: "",
      reason: "",
    });
  };

  const handleEditRule = (rule: AvailabilityRule) => {
    setEditingRule(rule);
    setRuleFormData({
      professional_id: rule.professional_id,
      day_of_week: rule.day_of_week.toString(),
      start_time: rule.start_time.slice(0, 5),
      end_time: rule.end_time.slice(0, 5),
      is_active: rule.is_active,
    });
    setIsRuleDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-2">Disponibilidade</h1>
        <p className="text-muted-foreground">Gerencie horários e bloqueios dos profissionais</p>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="w-4 h-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Clock className="w-4 h-4" /> Horários Recorrentes
          </TabsTrigger>
          <TabsTrigger value="timeoff" className="gap-2">
            <Ban className="w-4 h-4" /> Bloqueios/Folgas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <AvailabilityCalendar />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Regras de Disponibilidade</CardTitle>
              <Button onClick={() => setIsRuleDialogOpen(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Nova Regra
              </Button>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : rules?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma regra cadastrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Dia</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules?.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          {rule.professional?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {DAYS_OF_WEEK.find((d) => d.value === rule.day_of_week)?.label}
                        </TableCell>
                        <TableCell>
                          {rule.start_time.slice(0, 5)} - {rule.end_time.slice(0, 5)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              rule.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {rule.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRule(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Excluir esta regra?")) {
                                  deleteRuleMutation.mutate(rule.id);
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
        </TabsContent>

        <TabsContent value="timeoff" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bloqueios e Folgas</CardTitle>
              <Button onClick={() => setIsTimeOffDialogOpen(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Novo Bloqueio
              </Button>
            </CardHeader>
            <CardContent>
              {timeOffLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : timeOffBlocks?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum bloqueio cadastrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeOffBlocks?.map((block) => (
                      <TableRow key={block.id}>
                        <TableCell className="font-medium">
                          {block.professional?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(block.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          {" - "}
                          {format(new Date(block.end_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{block.reason || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Remover este bloqueio?")) {
                                deleteTimeOffMutation.mutate(block.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveRuleMutation.mutate(ruleFormData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Profissional *</Label>
              <Select
                value={ruleFormData.professional_id}
                onValueChange={(value) =>
                  setRuleFormData({ ...ruleFormData, professional_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {professionals?.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dia da Semana *</Label>
              <Select
                value={ruleFormData.day_of_week}
                onValueChange={(value) =>
                  setRuleFormData({ ...ruleFormData, day_of_week: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início *</Label>
                <Input
                  type="time"
                  value={ruleFormData.start_time}
                  onChange={(e) =>
                    setRuleFormData({ ...ruleFormData, start_time: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fim *</Label>
                <Input
                  type="time"
                  value={ruleFormData.end_time}
                  onChange={(e) =>
                    setRuleFormData({ ...ruleFormData, end_time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={ruleFormData.is_active}
                onCheckedChange={(checked) =>
                  setRuleFormData({ ...ruleFormData, is_active: checked })
                }
              />
              <Label>Ativo</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseRuleDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium text-white">
                {editingRule ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Time Off Dialog */}
      <Dialog open={isTimeOffDialogOpen} onOpenChange={setIsTimeOffDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Bloqueio</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveTimeOffMutation.mutate(timeOffFormData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Profissional *</Label>
              <Select
                value={timeOffFormData.professional_id}
                onValueChange={(value) =>
                  setTimeOffFormData({ ...timeOffFormData, professional_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {professionals?.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={timeOffFormData.start_date}
                  onChange={(e) =>
                    setTimeOffFormData({ ...timeOffFormData, start_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={timeOffFormData.end_date}
                  onChange={(e) =>
                    setTimeOffFormData({ ...timeOffFormData, end_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={timeOffFormData.reason}
                onChange={(e) =>
                  setTimeOffFormData({ ...timeOffFormData, reason: e.target.value })
                }
                placeholder="Ex: Férias, Congresso, etc."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseTimeOffDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium text-white">
                Criar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
