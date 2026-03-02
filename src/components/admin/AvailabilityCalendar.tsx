import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, CalendarPlus } from "lucide-react";
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

export default function AvailabilityCalendar() {
  const queryClient = useQueryClient();
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
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

  const { data: dateOverrides } = useQuery({
    queryKey: ["date-overrides", selectedProfessional],
    queryFn: async () => {
      if (!selectedProfessional) return [];
      const { data, error } = await supabase
        .from("date_overrides")
        .select("*")
        .eq("professional_id", selectedProfessional);
      if (error) throw error;
      return data as DateOverride[];
    },
    enabled: !!selectedProfessional,
  });

  const saveMultipleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProfessional || selectedDates.length === 0) return;

      const promises = selectedDates.map(async (date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        
        // Check if exists
        const existing = dateOverrides?.find((d) => d.override_date === dateStr);

        const payload = {
          professional_id: selectedProfessional,
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
      queryClient.invalidateQueries({ queryKey: ["date-overrides"] });
      toast.success(`${selectedDates.length} data(s) atualizada(s)!`);
      setIsDialogOpen(false);
      setSelectedDates([]);
    },
    onError: () => {
      toast.error("Erro ao salvar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("date_overrides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["date-overrides"] });
      toast.success("Configuração removida!");
    },
  });

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!selectedProfessional) {
      toast.error("Selecione um profissional primeiro");
      return;
    }
    setSelectedDates(dates || []);
  };

  const handleOpenDialog = () => {
    if (selectedDates.length === 0) {
      toast.error("Selecione pelo menos uma data");
      return;
    }
    setFormData({
      is_available: true,
      start_time: "09:00",
      end_time: "18:00",
      reason: "",
    });
    setIsDialogOpen(true);
  };

  const handleClearSelection = () => {
    setSelectedDates([]);
  };

  // Use T00:00:00 to force local timezone parsing (avoid UTC shift)
  const parseLocalDate = (dateStr: string) => new Date(dateStr + "T00:00:00");
  const availableDates = dateOverrides?.filter((d) => !d.is_blocked).map((d) => parseLocalDate(d.override_date)) || [];
  const blockedDates = dateOverrides?.filter((d) => d.is_blocked).map((d) => parseLocalDate(d.override_date)) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Disponibilidade</CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecione uma ou mais datas e clique em "Configurar Datas" para marcar como disponível ou indisponível
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Profissional</Label>
          <Select value={selectedProfessional} onValueChange={(value) => {
            setSelectedProfessional(value);
            setSelectedDates([]);
          }}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Selecione um profissional" />
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

        {selectedProfessional && (
          <>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span>Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span>Indisponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary" />
                <span>Selecionado</span>
              </div>
            </div>

            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={handleDateSelect}
              locale={ptBR}
              className="rounded-md border p-3 availability-calendar"
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
              <div className="flex flex-wrap items-center gap-3 p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedDates.length} data(s) selecionada(s)
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleClearSelection}>
                    Limpar
                  </Button>
                  <Button size="sm" onClick={handleOpenDialog} className="gap-2">
                    <CalendarPlus className="w-4 h-4" />
                    Configurar Datas
                  </Button>
                </div>
              </div>
            )}

            {dateOverrides && dateOverrides.length > 0 && (
              <div className="space-y-2">
                <Label>Datas configuradas:</Label>
                <div className="flex flex-wrap gap-2">
                  {dateOverrides.map((override) => (
                    <Badge
                      key={override.id}
                      variant={!override.is_blocked ? "default" : "destructive"}
                      className="gap-1 cursor-pointer hover:opacity-80"
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
                      {format(parseLocalDate(override.override_date), "dd/MM/yyyy", { locale: ptBR })}
                      {!override.is_blocked && override.start_time && (
                        <span className="ml-1 opacity-80">
                          ({override.start_time.slice(0, 5)}-{override.end_time?.slice(0, 5)})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Configurar {selectedDates.length} data(s)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Datas selecionadas:</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedDates.slice(0, 10).map((date, idx) => (
                    <Badge key={idx} variant="secondary">
                      {format(date, "dd/MM", { locale: ptBR })}
                    </Badge>
                  ))}
                  {selectedDates.length > 10 && (
                    <Badge variant="secondary">+{selectedDates.length - 10} mais</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={formData.is_available ? "default" : "outline"}
                  className={formData.is_available ? "flex-1 bg-green-600 hover:bg-green-700" : "flex-1"}
                  onClick={() => setFormData({ ...formData, is_available: true })}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Disponível
                </Button>
                <Button
                  variant={!formData.is_available ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, is_available: false })}
                >
                  <X className="w-4 h-4 mr-2" />
                  Indisponível
                </Button>
              </div>

              {formData.is_available ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
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
                  <Label>Motivo (opcional)</Label>
                  <Input
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="Ex: Feriado, Férias..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => saveMultipleMutation.mutate()} 
                  className="btn-premium text-white"
                  disabled={saveMultipleMutation.isPending}
                >
                  {saveMultipleMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
