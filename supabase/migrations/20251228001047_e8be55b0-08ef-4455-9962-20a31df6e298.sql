-- Add image_urls column to tasks table
ALTER TABLE public.tasks
ADD COLUMN image_urls text[] DEFAULT NULL;

-- Create storage bucket for task images
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-images', 'task-images', true);

-- Policy: Authenticated users can upload task images
CREATE POLICY "Authenticated users can upload task images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-images');

-- Policy: Anyone can view task images (public bucket)
CREATE POLICY "Anyone can view task images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'task-images');

-- Policy: Authenticated users can delete task images
CREATE POLICY "Authenticated users can delete task images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task-images');