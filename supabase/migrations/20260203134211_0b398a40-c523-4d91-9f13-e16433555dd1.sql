-- Stap 1: Wijzig kolom van enum naar text
ALTER TABLE costs 
  ALTER COLUMN categorie TYPE TEXT 
  USING categorie::TEXT;

-- Stap 2: Verwijder de ongebruikte enum type (voor opschonen)
DROP TYPE IF EXISTS cost_category;