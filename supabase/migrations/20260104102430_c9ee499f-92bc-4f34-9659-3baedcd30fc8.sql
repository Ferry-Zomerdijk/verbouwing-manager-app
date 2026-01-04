-- Tabel voor AI usage tracking
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usage_type text NOT NULL DEFAULT 'invoice_scan',
  created_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'
);

-- Index voor snelle queries per gebruiker en maand
CREATE INDEX idx_ai_usage_user_month ON public.ai_usage (user_id, created_at);

-- RLS policies
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Gebruikers kunnen hun eigen AI gebruik bekijken
CREATE POLICY "Users can view own AI usage"
ON public.ai_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Alleen service role kan AI usage records toevoegen (via edge functions)
CREATE POLICY "Service role can insert AI usage"
ON public.ai_usage FOR INSERT TO service_role
WITH CHECK (true);