-- Drop oude restrictieve policies
DROP POLICY IF EXISTS "Users can create photos for their projects" ON public.photos;
DROP POLICY IF EXISTS "Users can delete photos of their projects" ON public.photos;
DROP POLICY IF EXISTS "Users can view photos of their projects" ON public.photos;

-- Nieuwe policy: Iedereen met project toegang kan foto's bekijken
CREATE POLICY "Users can view photos of accessible projects" 
ON public.photos FOR SELECT 
USING (has_project_access(auth.uid(), project_id));

-- Nieuwe policy: Iedereen met project toegang kan foto's uploaden
CREATE POLICY "Users can create photos for accessible projects" 
ON public.photos FOR INSERT 
WITH CHECK (has_project_access(auth.uid(), project_id));

-- Nieuwe policy: Alleen eigenaar en admins kunnen verwijderen
CREATE POLICY "Only admins and owners can delete photos" 
ON public.photos FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (EXISTS ( 
    SELECT 1 FROM projects 
    WHERE projects.id = photos.project_id 
    AND projects.user_id = auth.uid()
  ))
);