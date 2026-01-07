-- Create push_subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for edge functions)
CREATE POLICY "Service role can manage all subscriptions"
ON public.push_subscriptions
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();