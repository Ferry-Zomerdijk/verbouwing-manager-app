-- Add color column to attendance_time_presets
ALTER TABLE public.attendance_time_presets
ADD COLUMN color text DEFAULT 'gray';