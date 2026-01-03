-- RLS policies voor user_pins tabel
-- Gebruikers kunnen alleen hun eigen PIN data beheren

-- Gebruikers kunnen hun eigen PIN data lezen
CREATE POLICY "Users can read own pin" 
ON public.user_pins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Gebruikers kunnen hun eigen PIN data aanmaken
CREATE POLICY "Users can insert own pin" 
ON public.user_pins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Gebruikers kunnen hun eigen PIN data updaten
CREATE POLICY "Users can update own pin" 
ON public.user_pins
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Gebruikers kunnen hun eigen PIN verwijderen
CREATE POLICY "Users can delete own pin" 
ON public.user_pins
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);