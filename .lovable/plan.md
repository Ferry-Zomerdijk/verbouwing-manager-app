

# Fix: Costs RLS policies uitbreiden voor admins en projectgebruikers

## Probleem
De vier RLS policies op de `costs` tabel checken alleen `projects.user_id = auth.uid()`. Admins en project_users worden niet meegenomen, waardoor Monique (admin) geen kostendata ziet ondanks dat ze de tab wel kan openen.

## Oplossing
Vervang de vier costs-policies zodat ze `has_project_access()` gebruiken (consistent met alle andere tabellen). DELETE blijft beperkt tot eigenaar + admin.

## Database migratie

```sql
-- SELECT: alle projectleden + admins
DROP POLICY "Users can view costs of their projects" ON costs;
CREATE POLICY "Users can view costs of accessible projects" ON costs
  FOR SELECT USING (has_project_access(auth.uid(), project_id));

-- INSERT: alle projectleden + admins
DROP POLICY "Users can create costs for their projects" ON costs;
CREATE POLICY "Users can create costs for accessible projects" ON costs
  FOR INSERT WITH CHECK (has_project_access(auth.uid(), project_id));

-- UPDATE: alle projectleden + admins
DROP POLICY "Users can update costs of their projects" ON costs;
CREATE POLICY "Users can update costs of accessible projects" ON costs
  FOR UPDATE USING (has_project_access(auth.uid(), project_id));

-- DELETE: alleen eigenaar + admin
DROP POLICY "Users can delete costs of their projects" ON costs;
CREATE POLICY "Only owners and admins can delete costs" ON costs
  FOR DELETE USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM projects WHERE id = costs.project_id AND user_id = auth.uid())
  );
```

## Geen code-wijzigingen nodig
De UI-logica (`isAdminOrOwner`) werkt al correct voor admins. Alleen de database-laag blokkeert de data.

