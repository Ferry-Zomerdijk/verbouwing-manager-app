
-- 1. Restrict contact_messages INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert contact messages" ON public.contact_messages;
CREATE POLICY "Service role can insert contact messages"
ON public.contact_messages
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Tighten storage DELETE policies for task-images and project-photos
DROP POLICY IF EXISTS "Authenticated users can delete task images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete task images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete project photos" ON storage.objects;

CREATE POLICY "Users can delete their own task images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own project photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Add caller access checks inside initialize_* SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.initialize_document_types(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  type_record RECORD;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_project_access(auth.uid(), p_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF EXISTS (SELECT 1 FROM document_types WHERE project_id = p_project_id) THEN
    RETURN;
  END IF;

  INSERT INTO document_types (project_id, naam, kleur, volgorde, is_systeem) VALUES
    (p_project_id, 'Contract', 'blue', 0, true),
    (p_project_id, 'Offerte', 'green', 1, true),
    (p_project_id, 'Factuur', 'yellow', 2, true),
    (p_project_id, 'Vergunning', 'red', 3, true),
    (p_project_id, 'Tekening', 'purple', 4, true),
    (p_project_id, 'Garantie', 'orange', 5, true),
    (p_project_id, 'Overig', 'gray', 6, true);

  FOR type_record IN
    SELECT dt.id, dt.naam FROM document_types dt WHERE dt.project_id = p_project_id
  LOOP
    UPDATE documents
    SET type_id = type_record.id
    WHERE project_id = p_project_id
      AND type::text = type_record.naam
      AND type_id IS NULL;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_house_parts(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_project_access(auth.uid(), p_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF EXISTS (SELECT 1 FROM house_parts WHERE project_id = p_project_id) THEN
    RETURN;
  END IF;

  INSERT INTO house_parts (project_id, naam, volgorde) VALUES
    (p_project_id, 'Woning', 0),
    (p_project_id, 'Keuken', 1),
    (p_project_id, 'Badkamer', 2),
    (p_project_id, 'Slaapkamer', 3),
    (p_project_id, 'Woonkamer', 4),
    (p_project_id, 'Hal', 5),
    (p_project_id, 'Zolder', 6),
    (p_project_id, 'Garage', 7),
    (p_project_id, 'Schuur', 8),
    (p_project_id, 'Bijgebouw', 9),
    (p_project_id, 'Tuin en buitenruimte', 10),
    (p_project_id, 'Poort', 11),
    (p_project_id, 'Brievenbus', 12),
    (p_project_id, 'CV-ketel en verwarming', 13),
    (p_project_id, 'Airconditioning', 14),
    (p_project_id, 'Dakgoten en afvoer', 15),
    (p_project_id, 'Elektrische installatie', 16),
    (p_project_id, 'Waterleiding en sanitair', 17),
    (p_project_id, 'Alarm en beveiliging', 18),
    (p_project_id, 'Zonnepanelen', 19),
    (p_project_id, 'Ventilatie en afzuiging', 20),
    (p_project_id, 'Ramen en deuren', 21),
    (p_project_id, 'Dak', 22),
    (p_project_id, 'Gevels', 23),
    (p_project_id, 'Zwembad/jacuzzi', 24);
END;
$function$;
