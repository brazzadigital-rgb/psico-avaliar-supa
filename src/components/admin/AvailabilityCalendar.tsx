import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, Trash2, CalendarPlus, User, Clock, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Professional {
  id: string;
  name: string;
}

interface DateOverride {
  id: string;
  professional_id: string;
  override_date: string;
  is_blocked: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

const parseLocalDate = (dateStr: string) => new Date(dateStr + "T00:00:00");

export default function AvailabilityCalendar() {
  const queryClient = useQueryClient();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterProfessional, setFilterProfessional] = useState<string>("all");
  const [formData, setFormData] = useState({
    professional_id: "",
    is_available: true,
    start_time: "09:00",
    end_time: "18:00",
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

  // Load ALL date overrides (optionally filtered for display)
  const { data: allDateOverrides } = useQuery({
    queryKey: ["date-overrides-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("date_overrides")
        .select("*, professional:professionals(name)")
        .order("override_date");
      if (error) throw error;
      return data as (DateOverride & { professional?: { name: string } })[];
    },
  });

  // Filter overrides for display
  const displayedOverrides = useMemo(() => {
    if (!allDateOverrides) return [];
    if (filterProfessional === "all") return allDateOverrides;
    return allDateOverrides.filter((d) => d.professional_id === filterProfessional);
  }, [allDateOverrides, filterProfessional]);

  const availableDates = useMemo(
    () => displayedOverrides.filter((d) => !d.is_blocked).map((d) => parseLocalDate(d.override_date)),
    [displayedOverrides]
  );
  const blockedDates = useMemo(
    () => displayedOverrides.filter((d) => d.is_blocked).map((d) => parseLocalDate(d.override_date)),
    [displayedOverrides]
  );

  const saveMultipleMutation = useMutation({
    mutationFn: async () => {
      if (!formData.professional_id || selectedDates.length === 0) return;

      const promises = selectedDates.map(async (date) => {
        const dateStr = format(date, "yyyy-MM-dd");

        // Check if exists for this professional
        const existing = allDateOverrides?.find(
          (d) => d.override_date === dateStr && d.professional_id === formData.professional_id
        );

        const payload = {
          professional_id: formData.professional_id,
          override_date: dateStr,
          is_blocked: !formData.is_available,
          start_time: formData.is_available ? formData.start_time : null,
          end_time: formData.is_available ? formData.end_time : null,
          reason: formData.is_available ? null : formData.reason || null,
        };

        if (existing) {
          const { error } = await supabase
            .from("date_overrides")
            .update(payload)
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("date_overrides").insert([payload]);
          if (error) throw error;
        }
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["date-overrides-all"] });
      const profName = professionals?.find((p) => p.id === formData.professional_id)?.name;
      toast.success(
        `${selectedDates.length} data(s) configurada(s) para ${profName}!`
      );
      setIsDialogOpen(false);
      setSelectedDates([]);
    },
    onError: () => {
      toast.error("Erro ao salvar configuração");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("date_overrides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["date-overrides-all"] });
      toast.success("Configuração removida!");
    },
  });

  const handleDateSelect = (dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
  };

  const handleOpenDialog = () => {
    if (selectedDates.length === 0) {
      toast.error("Selecione pelo menos uma data no calendário");
      return;
    }
    setFormData({
      professional_id: professionals?.length === 1 ? professionals[0].id : "",
      is_available: true,
      start_time: "09:00",
      end_time: "18:00",
      reason: "",
    });
    setIsDialogOpen(true);
  };

  // Group overrides by professional for the summary
  const groupedOverrides = useMemo(() => {
    const groups: Record<string, { profName: string; overrides: typeof displayedOverrides }> = {};
    displayedOverrides.forEach((o) => {
      if (!groups[o.professional_id]) {
        groups[o.professional_id] = {
          profName: (o as any).professional?.name || "—",
          overrides: [],
        };
      }
      groups[o.professional_id].overrides.push(o);
    });
    // Sort overrides within each group by date
    Object.values(groups).forEach((g) =>
      g.overrides.sort((a, b) => a.override_date.localeCompare(b.override_date))
    );
    return groups;
  }, [displayedOverrides]);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Calendário de Disponibilidade</h2>
          <p className="text-sm text-muted-foreground">
            Selecione as datas no calendário e configure disponibilidade para cada profissional
          </p>
        </div>
        <Button
          onClick={handleOpenDialog}
          disabled={selectedDates.length === 0}
          className="gap-2 btn-premium text-white shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          Configurar {selectedDates.length > 0 ? `${selectedDates.length} data(s)` : "Datas"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar section */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Indisponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Selecionado</span>
              </div>
            </div>

            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={handleDateSelect}
              locale={ptBR}
              className="rounded-md border p-3 pointer-events-auto availability-calendar w-full"
              modifiers={{
                available: availableDates,
                blocked: blockedDates,
              }}
              modifiersClassNames={{
                available: "day-available",
                blocked: "day-blocked",
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />

            {selectedDates.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg">
                <span className="text-sm font-medium">
                  {selectedDates.length} data(s) selecionada(s)
                </span>
                <Button size="sm" variant="ghost" onClick={() => setSelectedDates([])}>
                  Limpar seleção
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - configured dates */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Datas Configuradas
              </h3>
            </div>

            {/* Professional filter */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filtrar por profissional
              </Label>
              <Select value={filterProfessional} onValueChange={setFilterProfessional}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {professionals?.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Grouped list */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {Object.keys(groupedOverrides).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma data configurada
                </p>
              ) : (
                Object.entries(groupedOverrides).map(([profId, group]) => (
                  <div key={profId} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      {group.profName}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.overrides.map((override) => (
                        <Badge
                          key={override.id}
                          variant={!override.is_blocked ? "default" : "destructive"}
                          className="gap-1 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            if (confirm("Remover esta configuração?")) {
                              deleteMutation.mutate(override.id);
                            }
                          }}
                        >
                          {!override.is_blocked ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {format(parseLocalDate(override.override_date), "dd/MM", {
                            locale: ptBR,
                          })}
                          {!override.is_blocked && override.start_time && (
                            <span className="opacity-75">
                              {override.start_time.slice(0, 5)}-{override.end_time?.slice(0, 5)}
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar {selectedDates.length} data(s)</DialogTitle>
            <DialogDescription>
              Defina o profissional e o tipo de disponibilidade para as datas selecionadas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Selected dates preview */}
            <div className="flex flex-wrap gap-1.5">
              {selectedDates
                .sort((a, b) => a.getTime() - b.getTime())
                .slice(0, 12)
                .map((date, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {format(date, "dd/MM", { locale: ptBR })}
                  </Badge>
                ))}
              {selectedDates.length > 12 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedDates.length - 12}
                </Badge>
              )}
            </div>

            {/* Professional selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-muted-foreground" />
                Profissional *
              </Label>
              <Select
                value={formData.professional_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, professional_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
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

            {/* Availability toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.is_available ? "default" : "outline"}
                className={
                  formData.is_available
                    ? "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "flex-1"
                }
                onClick={() => setFormData({ ...formData, is_available: true })}
              >
                <Check className="w-4 h-4 mr-2" />
                Disponível
              </Button>
              <Button
                type="button"
                variant={!formData.is_available ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => setFormData({ ...formData, is_available: false })}
              >
                <X className="w-4 h-4 mr-2" />
                Indisponível
              </Button>
            </div>

            {/* Time inputs or reason */}
            {formData.is_available ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Início</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Fim</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm">Motivo (opcional)</Label>
                <Input
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Ex: Feriado, Férias..."
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveMultipleMutation.mutate()}
                className="btn-premium text-white"
                disabled={saveMultipleMutation.isPending || !formData.professional_id}
              >
                {saveMultipleMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
