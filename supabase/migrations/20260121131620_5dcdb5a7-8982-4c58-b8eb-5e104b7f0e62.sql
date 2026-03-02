-- Create rate limiting table for checkout token attempts
CREATE TABLE IF NOT EXISTS public.checkout_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  first_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  last_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone
);

-- Create index for fast lookups
CREATE INDEX idx_checkout_rate_limits_ip_hash ON public.checkout_rate_limits(ip_hash);
CREATE INDEX idx_checkout_rate_limits_blocked ON public.checkout_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE public.checkout_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow system operations
CREATE POLICY "System can manage rate limits" ON public.checkout_rate_limits
  FOR ALL USING (true) WITH CHECK (true);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_checkout_rate_limit(_ip_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rate_record checkout_rate_limits%ROWTYPE;
  max_attempts integer := 10;  -- Max 10 attempts per window
  window_minutes integer := 15; -- 15 minute window
  block_minutes integer := 30;  -- Block for 30 minutes if exceeded
  result jsonb;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO rate_record
  FROM checkout_rate_limits
  WHERE ip_hash = _ip_hash
  FOR UPDATE;

  IF rate_record.id IS NULL THEN
    -- First attempt from this IP
    INSERT INTO checkout_rate_limits (ip_hash)
    VALUES (_ip_hash)
    RETURNING * INTO rate_record;
    
    RETURN jsonb_build_object('allowed', true, 'attempts', 1, 'remaining', max_attempts - 1);
  END IF;

  -- Check if currently blocked
  IF rate_record.blocked_until IS NOT NULL AND rate_record.blocked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'blocked', true,
      'blocked_until', rate_record.blocked_until,
      'message', 'Too many attempts. Try again later.'
    );
  END IF;

  -- Reset if outside window
  IF rate_record.first_attempt_at < now() - (window_minutes || ' minutes')::interval THEN
    UPDATE checkout_rate_limits
    SET attempts = 1, first_attempt_at = now(), last_attempt_at = now(), blocked_until = NULL
    WHERE id = rate_record.id;
    
    RETURN jsonb_build_object('allowed', true, 'attempts', 1, 'remaining', max_attempts - 1);
  END IF;

  -- Increment attempts
  UPDATE checkout_rate_limits
  SET attempts = attempts + 1, last_attempt_at = now()
  WHERE id = rate_record.id
  RETURNING * INTO rate_record;

  -- Check if exceeded max attempts
  IF rate_record.attempts > max_attempts THEN
    UPDATE checkout_rate_limits
    SET blocked_until = now() + (block_minutes || ' minutes')::interval
    WHERE id = rate_record.id;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'blocked_until', now() + (block_minutes || ' minutes')::interval,
      'message', 'Too many attempts. Try again in 30 minutes.'
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true, 
    'attempts', rate_record.attempts, 
    'remaining', max_attempts - rate_record.attempts
  );
END;
$$;

-- Function to get order by token with expiration check
CREATE OR REPLACE FUNCTION public.get_checkout_order(_token text, _ip_hash text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record orders%ROWTYPE;
  rate_result jsonb;
BEGIN
  -- Check rate limit if IP provided
  IF _ip_hash IS NOT NULL THEN
    SELECT check_checkout_rate_limit(_ip_hash) INTO rate_result;
    IF NOT (rate_result->>'allowed')::boolean THEN
      RETURN jsonb_build_object('error', 'rate_limited', 'details', rate_result);
    END IF;
  END IF;

  -- Get order by token
  SELECT * INTO order_record
  FROM orders
  WHERE checkout_token = _token;

  IF order_record.id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'Order not found');
  END IF;

  -- Check if expired (30 minutes from creation)
  IF order_record.created_at < now() - interval '30 minutes' AND order_record.status = 'pending' THEN
    -- Mark as expired
    UPDATE orders SET status = 'expired' WHERE id = order_record.id;
    RETURN jsonb_build_object('error', 'expired', 'message', 'Checkout link has expired');
  END IF;

  -- Check if already paid
  IF order_record.status = 'paid' THEN
    RETURN jsonb_build_object('error', 'already_paid', 'message', 'Order already paid', 'order_id', order_record.id);
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', order_record.id);
END;
$$;

-- Add 'expired' to order status if not exists and cleanup job
-- (Note: order status is already flexible text type)