-- Create table for custom payment payers per project
CREATE TABLE public.cost_payers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cost_payers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view payers for accessible projects" 
ON public.cost_payers 
FOR SELECT 
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create payers for accessible projects" 
ON public.cost_payers 
FOR INSERT 
WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update payers for accessible projects" 
ON public.cost_payers 
FOR UPDATE 
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete payers" 
ON public.cost_payers 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = cost_payers.project_id) AND (projects.user_id = auth.uid())))));

-- Create index for faster queries
CREATE INDEX idx_cost_payers_project_id ON public.cost_payers(project_id);