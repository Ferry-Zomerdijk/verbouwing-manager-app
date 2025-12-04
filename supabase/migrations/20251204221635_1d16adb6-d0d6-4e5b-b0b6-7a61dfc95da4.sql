-- Admins kunnen alle profielen zien
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));