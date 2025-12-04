-- Create storage bucket for task update images
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-update-images', 'task-update-images', true);

-- Storage policies for task update images
CREATE POLICY "Authenticated users can upload task update images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-update-images');

CREATE POLICY "Anyone can view task update images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-update-images');

CREATE POLICY "Users can delete their own task update images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-update-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add image_urls column to task_updates
ALTER TABLE public.task_updates
ADD COLUMN image_urls TEXT[] DEFAULT '{}';