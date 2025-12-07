-- Drop oude restrictieve policies
DROP POLICY IF EXISTS "Users can create documents for their projects" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents of their projects" ON public.documents;
DROP POLICY IF EXISTS "Users can view documents of their projects" ON public.documents;

-- Nieuwe policy: Iedereen met project toegang kan documenten bekijken
CREATE POLICY "Users can view documents of accessible projects" 
ON public.documents FOR SELECT 
USING (has_project_access(auth.uid(), project_id));

-- Nieuwe policy: Iedereen met project toegang kan documenten uploaden
CREATE POLICY "Users can create documents for accessible projects" 
ON public.documents FOR INSERT 
WITH CHECK (has_project_access(auth.uid(), project_id));

-- Nieuwe policy: Alleen eigenaar en admins kunnen verwijderen
CREATE POLICY "Only admins and owners can delete documents" 
ON public.documents FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (EXISTS ( 
    SELECT 1 FROM projects 
    WHERE projects.id = documents.project_id 
    AND projects.user_id = auth.uid()
  ))
);