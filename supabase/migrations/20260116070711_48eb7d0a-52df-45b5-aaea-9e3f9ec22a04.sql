-- Add voornaam and achternaam columns to contractors table
ALTER TABLE contractors ADD COLUMN voornaam text;
ALTER TABLE contractors ADD COLUMN achternaam text;

-- Migrate existing data: split naam on first space
UPDATE contractors
SET voornaam = split_part(naam, ' ', 1),
    achternaam = CASE 
      WHEN position(' ' in naam) > 0 THEN substring(naam from position(' ' in naam) + 1)
      ELSE NULL
    END;

-- Drop the old naam column
ALTER TABLE contractors DROP COLUMN naam;

-- Add naam as a generated column for backward compatibility
ALTER TABLE contractors ADD COLUMN naam text GENERATED ALWAYS AS (
  TRIM(COALESCE(voornaam, '') || ' ' || COALESCE(achternaam, ''))
) STORED;