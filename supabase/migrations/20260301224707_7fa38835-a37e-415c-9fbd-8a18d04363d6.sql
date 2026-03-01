
-- 1. Add file_hashes column to costs table for duplicate detection
ALTER TABLE public.costs ADD COLUMN file_hashes text[] DEFAULT '{}';

-- 2. Create suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  naam text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, naam)
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policies following has_project_access pattern
CREATE POLICY "Users can view suppliers of accessible projects"
ON public.suppliers FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create suppliers for accessible projects"
ON public.suppliers FOR INSERT
WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update suppliers of accessible projects"
ON public.suppliers FOR UPDATE
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete suppliers"
ON public.suppliers FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = suppliers.project_id AND projects.user_id = auth.uid()
  )
);

-- 3. Migrate existing supplier names from costs
INSERT INTO public.suppliers (project_id, naam, sort_order)
SELECT DISTINCT c.project_id, c.leverancier, 0
FROM public.costs c
WHERE c.leverancier IS NOT NULL AND c.leverancier != ''
ON CONFLICT (project_id, naam) DO NOTHING;
