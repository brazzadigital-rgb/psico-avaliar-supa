-- Enable realtime for appointments table to track check-ins
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;