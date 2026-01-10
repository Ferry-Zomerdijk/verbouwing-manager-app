-- Create key_history table to track key transfers
CREATE TABLE public.key_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_id uuid NOT NULL REFERENCES public.keys(id) ON DELETE CASCADE,
  holder_name text NOT NULL,
  received_at timestamp with time zone NOT NULL,
  returned_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.key_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - inherit access from parent key
CREATE POLICY "Users can view key history of accessible projects"
ON public.key_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM keys 
    WHERE keys.id = key_history.key_id 
    AND has_project_access(auth.uid(), keys.project_id)
  )
);

CREATE POLICY "Users can create key history for accessible projects"
ON public.key_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM keys 
    WHERE keys.id = key_history.key_id 
    AND has_project_access(auth.uid(), keys.project_id)
  )
);

CREATE POLICY "Users can update key history for accessible projects"
ON public.key_history FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM keys 
    WHERE keys.id = key_history.key_id 
    AND has_project_access(auth.uid(), keys.project_id)
  )
);

-- Create index for faster lookups
CREATE INDEX idx_key_history_key_id ON public.key_history(key_id);
CREATE INDEX idx_key_history_returned_at ON public.key_history(key_id, returned_at) WHERE returned_at IS NULL;