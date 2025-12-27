-- Update existing tasks: set deadline to begindatum where deadline is null but begindatum is set
UPDATE tasks 
SET deadline = begindatum 
WHERE deadline IS NULL AND begindatum IS NOT NULL;