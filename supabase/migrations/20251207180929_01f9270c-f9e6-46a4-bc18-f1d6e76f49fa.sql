-- Drop oude restrictieve policies
DROP POLICY IF EXISTS "Users can create contractors for their projects" ON public.contractors;
DROP POLICY IF EXISTS "Users can delete contractors of their projects" ON public.contractors;
DROP POLICY IF EXISTS "Users can update contractors of their projects" ON public.contractors;
DROP POLICY IF EXISTS "Users can view contractors of their projects" ON public.contractors;

-- Nieuwe policy: Iedereen met project toegang kan contractors bekijken
CREATE POLICY "Users can view contractors of accessible projects" 
ON public.contractors FOR SELECT 
USING (has_project_access(auth.uid(), project_id));

-- Nieuwe policy: Iedereen met project toegang kan contractors aanmaken
CREATE POLICY "Users can create contractors for accessible projects" 
ON public.contractors FOR INSERT 
WITH CHECK (has_project_access(auth.uid(), project_id));

-- Nieuwe policy: Iedereen met project toegang kan contractors updaten
CREATE POLICY "Users can update contractors of accessible projects" 
ON public.contractors FOR UPDATE 
USING (has_project_access(auth.uid(), project_id));

-- Nieuwe policy: Alleen eigenaar en admins kunnen verwijderen
CREATE POLICY "Only admins and owners can delete contractors" 
ON public.contractors FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (EXISTS ( 
    SELECT 1 FROM projects 
    WHERE projects.id = contractors.project_id 
    AND projects.user_id = auth.uid()
  ))
);