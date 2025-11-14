-- Voeg begindatum veld toe aan tasks tabel
ALTER TABLE tasks ADD COLUMN begindatum date;

-- Voeg deel_van_huis veld toe aan tasks tabel
ALTER TABLE tasks ADD COLUMN deel_van_huis text;

-- De bestaande triggers blijven werken voor updated_at