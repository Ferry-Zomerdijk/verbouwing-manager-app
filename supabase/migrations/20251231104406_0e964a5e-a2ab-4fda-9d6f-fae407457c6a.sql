-- Create table for public project shares
CREATE TABLE public.public_project_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  view_count integer DEFAULT 0
);

-- Index for fast token lookups
CREATE INDEX idx_public_project_shares_token ON public.public_project_shares(share_token);
CREATE INDEX idx_public_project_shares_project ON public.public_project_shares(project_id);

-- Enable Row Level Security
ALTER TABLE public.public_project_shares ENABLE ROW LEVEL SECURITY;

-- Only project owners and admins can view shares
CREATE POLICY "Project owners and admins can view shares"
ON public.public_project_shares
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = public_project_shares.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Only project owners and admins can create shares
CREATE POLICY "Project owners and admins can create shares"
ON public.public_project_shares
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = public_project_shares.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Only project owners and admins can update shares
CREATE POLICY "Project owners and admins can update shares"
ON public.public_project_shares
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = public_project_shares.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Only project owners and admins can delete shares
CREATE POLICY "Project owners and admins can delete shares"
ON public.public_project_shares
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = public_project_shares.project_id
    AND projects.user_id = auth.uid()
  )
);