-- Add pending_payment to appointment_status enum
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'pending_payment';