-- Create project_invitations table
CREATE TABLE public.project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  user_id UUID
);

-- Enable RLS
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Project owners and admins can create invitations
CREATE POLICY "Project owners and admins can create invitations"
ON public.project_invitations
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_invitations.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Policy: Project owners and admins can view invitations
CREATE POLICY "Project owners and admins can view invitations"
ON public.project_invitations
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_invitations.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Policy: Project owners and admins can delete invitations
CREATE POLICY "Project owners and admins can delete invitations"
ON public.project_invitations
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_invitations.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create index for faster token lookups
CREATE INDEX idx_project_invitations_token ON public.project_invitations(invite_token);
CREATE INDEX idx_project_invitations_email ON public.project_invitations(email);