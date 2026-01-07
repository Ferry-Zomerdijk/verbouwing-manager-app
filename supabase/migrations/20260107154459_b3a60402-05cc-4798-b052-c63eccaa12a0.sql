-- Maak project-photos bucket aan
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-photos', 'project-photos', true);

-- SELECT policy: Iedereen kan project foto's bekijken (bucket is public)
CREATE POLICY "Anyone can view project photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'project-photos');

-- INSERT policy: Authenticated users kunnen uploaden
CREATE POLICY "Authenticated users can upload project photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'project-photos' 
  AND auth.role() = 'authenticated'
);

-- DELETE policy: Authenticated users kunnen verwijderen
CREATE POLICY "Authenticated users can delete project photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'project-photos' 
  AND auth.role() = 'authenticated'
);