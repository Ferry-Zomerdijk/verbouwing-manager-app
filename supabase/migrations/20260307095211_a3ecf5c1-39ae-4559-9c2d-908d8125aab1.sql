ALTER TABLE maintenance_instructions 
  ALTER COLUMN periode_van TYPE integer USING EXTRACT(MONTH FROM periode_van)::integer,
  ALTER COLUMN periode_tot TYPE integer USING EXTRACT(MONTH FROM periode_tot)::integer;