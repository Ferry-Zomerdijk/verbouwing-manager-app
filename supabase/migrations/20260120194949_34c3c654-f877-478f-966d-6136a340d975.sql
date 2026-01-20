-- Voeg betaald_door kolom toe aan costs tabel
ALTER TABLE costs ADD COLUMN betaald_door TEXT DEFAULT 'Ntb';

-- Update bestaande records naar 'Ntb' waar nog geen waarde is
UPDATE costs SET betaald_door = 'Ntb' WHERE betaald_door IS NULL;