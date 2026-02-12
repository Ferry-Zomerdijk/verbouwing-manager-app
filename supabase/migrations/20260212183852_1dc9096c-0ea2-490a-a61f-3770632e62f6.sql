
-- Create maintenance_instructions table
CREATE TABLE public.maintenance_instructions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  titel text NOT NULL,
  beschrijving text,
  deel_van_huis text,
  frequentie text,
  contact_naam text,
  contact_telefoon text,
  volgorde integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_instructions ENABLE ROW LEVEL SECURITY;

-- RLS policies following existing pattern
CREATE POLICY "Users can view instructions of accessible projects"
ON public.maintenance_instructions FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create instructions for accessible projects"
ON public.maintenance_instructions FOR INSERT
WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update instructions of accessible projects"
ON public.maintenance_instructions FOR UPDATE
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete instructions"
ON public.maintenance_instructions FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = maintenance_instructions.project_id 
    AND projects.user_id = auth.uid()
  )
);
