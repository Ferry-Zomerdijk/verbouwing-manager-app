-- Add UPDATE policy for documents table
CREATE POLICY "Users can update documents of accessible projects"
ON public.documents
FOR UPDATE
USING (has_project_access(auth.uid(), project_id))
WITH CHECK (has_project_access(auth.uid(), project_id));