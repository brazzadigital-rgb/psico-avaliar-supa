-- Enable pgcrypto extension for secure random generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing trigger/function if partial migration occurred
DROP TRIGGER IF EXISTS trigger_set_checkout_token ON public.orders;
DROP FUNCTION IF EXISTS public.set_checkout_token();
DROP FUNCTION IF EXISTS public.generate_checkout_token();

-- Add checkout_token column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'checkout_token'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN checkout_token text UNIQUE;
  END IF;
END $$;

-- Create index for fast token lookup (if not exists)
CREATE INDEX IF NOT EXISTS idx_orders_checkout_token ON public.orders(checkout_token);

-- Function to generate secure checkout token
CREATE OR REPLACE FUNCTION public.generate_checkout_token()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  token text;
  token_exists boolean;
BEGIN
  LOOP
    -- Generate a secure random token using pgcrypto
    token := encode(extensions.gen_random_bytes(24), 'base64');
    -- Replace URL-unsafe characters
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE checkout_token = token) INTO token_exists;
    
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$;

-- Trigger to auto-generate checkout_token on insert
CREATE OR REPLACE FUNCTION public.set_checkout_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.checkout_token IS NULL THEN
    NEW.checkout_token := generate_checkout_token();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_checkout_token
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_checkout_token();

-- Generate tokens for existing orders without one
UPDATE public.orders 
SET checkout_token = generate_checkout_token() 
WHERE checkout_token IS NULL;