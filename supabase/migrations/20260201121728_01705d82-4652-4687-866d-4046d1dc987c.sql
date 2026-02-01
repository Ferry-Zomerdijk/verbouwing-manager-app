-- Create cost_categories table for project-specific cost category configuration
CREATE TABLE public.cost_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  naam text NOT NULL,
  kleur text DEFAULT 'gray',
  volgorde integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as cost_payers)
CREATE POLICY "Users can view categories of accessible projects"
  ON public.cost_categories FOR SELECT
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create categories for accessible projects"
  ON public.cost_categories FOR INSERT
  WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update categories for accessible projects"
  ON public.cost_categories FOR UPDATE
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete categories"
  ON public.cost_categories FOR DELETE
  USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM projects WHERE id = cost_categories.project_id AND user_id = auth.uid())
  );