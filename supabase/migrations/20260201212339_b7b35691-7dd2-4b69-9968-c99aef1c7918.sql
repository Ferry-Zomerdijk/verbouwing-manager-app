-- Add UPDATE policy for photos table so users can change the fase
CREATE POLICY "Users can update photos of accessible projects" 
ON public.photos 
FOR UPDATE 
USING (has_project_access(auth.uid(), project_id));