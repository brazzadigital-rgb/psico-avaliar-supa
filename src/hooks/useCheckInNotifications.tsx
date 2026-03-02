import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserCheck, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { playCheckInSound, playNewAppointmentSound } from '@/lib/notificationSounds';

export function useCheckInNotifications() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Subscribe to realtime updates on appointments table
    channelRef.current = supabase
      .channel('checkin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          const newRecord = payload.new as { 
            checked_in_at: string | null; 
            client_id: string | null;
            scheduled_time: string;
            id: string;
          };
          const oldRecord = payload.old as { checked_in_at: string | null };

          // Only notify when checked_in_at changes from null to a value
          if (!oldRecord.checked_in_at && newRecord.checked_in_at) {
            // Play check-in sound
            playCheckInSound();

            // Fetch client name
            let clientName = 'Paciente';
            if (newRecord.client_id) {
              const { data: client } = await supabase
                .from('clients')
                .select('full_name')
                .eq('id', newRecord.client_id)
                .single();
              
              if (client) {
                clientName = client.full_name;
              }
            }

            const checkInTime = format(new Date(newRecord.checked_in_at), 'HH:mm', { locale: ptBR });

            toast.success(
              `${clientName} fez check-in!`,
              {
                description: `Consulta das ${newRecord.scheduled_time.slice(0, 5)} - Check-in às ${checkInTime}`,
                duration: 8000,
                icon: <UserCheck className="h-5 w-5 text-primary" />,
              }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          const newRecord = payload.new as { 
            client_id: string | null;
            scheduled_date: string;
            scheduled_time: string;
            service_id: string | null;
          };

          // Play new appointment sound
          playNewAppointmentSound();

          // Fetch client and service names
          let clientName = 'Novo paciente';
          let serviceName = 'Consulta';

          if (newRecord.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name')
              .eq('id', newRecord.client_id)
              .single();
            
            if (client) {
              clientName = client.full_name;
            }
          }

          if (newRecord.service_id) {
            const { data: service } = await supabase
              .from('services')
              .select('name')
              .eq('id', newRecord.service_id)
              .single();
            
            if (service) {
              serviceName = service.name;
            }
          }

          const appointmentDate = format(new Date(newRecord.scheduled_date), "dd/MM", { locale: ptBR });

          toast.info(
            `Novo agendamento: ${clientName}`,
            {
              description: `${serviceName} - ${appointmentDate} às ${newRecord.scheduled_time.slice(0, 5)}`,
              duration: 8000,
              icon: <CalendarPlus className="h-5 w-5 text-blue-500" />,
            }
          );
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);
}
