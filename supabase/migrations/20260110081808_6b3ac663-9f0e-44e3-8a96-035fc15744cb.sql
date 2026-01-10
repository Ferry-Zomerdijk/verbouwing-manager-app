-- Create keys table for key management
CREATE TABLE public.keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  key_number text NOT NULL,
  deel_van_huis text NOT NULL,
  sequence_number integer NOT NULL,
  current_holder text,
  received_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, deel_van_huis, sequence_number)
);

-- Enable RLS
ALTER TABLE public.keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view keys of accessible projects"
ON public.keys FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create keys for accessible projects"
ON public.keys FOR INSERT
WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update keys of accessible projects"
ON public.keys FOR UPDATE
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete keys"
ON public.keys FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = keys.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_keys_updated_at
BEFORE UPDATE ON public.keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_keys_project_id ON public.keys(project_id);
CREATE INDEX idx_keys_deel_van_huis ON public.keys(project_id, deel_van_huis);