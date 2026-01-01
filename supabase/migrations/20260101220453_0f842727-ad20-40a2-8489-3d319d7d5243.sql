-- Add column to track if expiry reminder was sent
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS expiry_reminder_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.subscriptions.expiry_reminder_sent_at IS 'Timestamp when the 7-day expiry reminder was sent';