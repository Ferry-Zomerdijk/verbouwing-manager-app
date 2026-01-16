-- Create document_types table for flexible, per-project document types
CREATE TABLE public.document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  naam text NOT NULL,
  kleur text DEFAULT 'gray',
  volgorde integer DEFAULT 0,
  is_systeem boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_document_types_project_id ON public.document_types(project_id);

-- Enable RLS
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view types of accessible projects"
  ON public.document_types FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create types for accessible projects"
  ON public.document_types FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update types of accessible projects"
  ON public.document_types FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Only owners/admins can delete non-system types"
  ON public.document_types FOR DELETE
  USING (
    NOT is_systeem AND (
      public.has_role(auth.uid(), 'admin') OR 
      EXISTS (SELECT 1 FROM public.projects WHERE id = document_types.project_id AND user_id = auth.uid())
    )
  );

-- Add type_id column to documents table
ALTER TABLE public.documents ADD COLUMN type_id uuid REFERENCES public.document_types(id) ON DELETE SET NULL;

-- Create function to initialize default document types for a project
CREATE OR REPLACE FUNCTION public.initialize_document_types(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  type_record RECORD;
  new_type_id uuid;
BEGIN
  -- Check if types already exist for this project
  IF EXISTS (SELECT 1 FROM document_types WHERE project_id = p_project_id) THEN
    RETURN;
  END IF;

  -- Create default document types
  INSERT INTO document_types (project_id, naam, kleur, volgorde, is_systeem) VALUES
    (p_project_id, 'Contract', 'blue', 0, true),
    (p_project_id, 'Offerte', 'green', 1, true),
    (p_project_id, 'Factuur', 'yellow', 2, true),
    (p_project_id, 'Vergunning', 'red', 3, true),
    (p_project_id, 'Tekening', 'purple', 4, true),
    (p_project_id, 'Garantie', 'orange', 5, true),
    (p_project_id, 'Overig', 'gray', 6, true);

  -- Migrate existing documents to new type_id based on old type ENUM
  FOR type_record IN 
    SELECT dt.id, dt.naam 
    FROM document_types dt 
    WHERE dt.project_id = p_project_id
  LOOP
    UPDATE documents 
    SET type_id = type_record.id 
    WHERE project_id = p_project_id 
      AND type::text = type_record.naam 
      AND type_id IS NULL;
  END LOOP;
END;
$$;