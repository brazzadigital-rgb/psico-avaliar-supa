-- Create table for specific date overrides (available or blocked dates)
CREATE TABLE public.date_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  start_time TIME WITHOUT TIME ZONE,
  end_time TIME WITHOUT TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, date)
);

-- Enable RLS
ALTER TABLE public.date_overrides ENABLE ROW LEVEL SECURITY;

-- Admins can manage date overrides
CREATE POLICY "Admins can manage date overrides"
ON public.date_overrides
FOR ALL
USING (is_admin(auth.uid()));

-- Anyone can view date overrides (for booking system)
CREATE POLICY "Anyone can view date overrides"
ON public.date_overrides
FOR SELECT
USING (true);