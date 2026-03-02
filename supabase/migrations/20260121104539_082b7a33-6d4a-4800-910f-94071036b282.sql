-- Add check-in tracking fields to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS checked_in_by UUID DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.appointments.checked_in_at IS 'Timestamp when client checked in via QR code';
COMMENT ON COLUMN public.appointments.checked_in_by IS 'User ID who performed the check-in (receptionist/admin)';