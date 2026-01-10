-- Create contact_categories table
CREATE TABLE public.contact_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  icoon TEXT DEFAULT 'folder',
  volgorde INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_categories
CREATE POLICY "Users can view categories of accessible projects"
ON public.contact_categories FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create categories for accessible projects"
ON public.contact_categories FOR INSERT
WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update categories of accessible projects"
ON public.contact_categories FOR UPDATE
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete categories"
ON public.contact_categories FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = contact_categories.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_contact_categories_project_id ON public.contact_categories(project_id);

-- Extend contractors table with new columns
ALTER TABLE public.contractors 
ADD COLUMN category_id UUID REFERENCES public.contact_categories(id) ON DELETE SET NULL,
ADD COLUMN adres TEXT,
ADD COLUMN label TEXT,
ADD COLUMN is_actief BOOLEAN DEFAULT true;

-- Create index for category lookup
CREATE INDEX idx_contractors_category_id ON public.contractors(category_id);