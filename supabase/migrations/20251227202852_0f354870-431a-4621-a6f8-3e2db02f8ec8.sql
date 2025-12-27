-- Create user_pins table for PIN-based authentication
CREATE TABLE public.user_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  encrypted_password text NOT NULL,
  failed_attempts int DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no policies = no access via normal client)
-- This ensures PINs can only be verified through edge functions

-- Create trigger for updated_at
CREATE TRIGGER update_user_pins_updated_at
  BEFORE UPDATE ON public.user_pins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_user_pins_user_id ON public.user_pins(user_id);