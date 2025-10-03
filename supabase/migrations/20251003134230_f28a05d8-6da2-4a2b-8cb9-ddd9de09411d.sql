-- Delete existing attendance records for VGR (person_id = 3) in October 2025
-- This allows recurrent patterns to apply instead
DELETE FROM attendance 
WHERE person_id = 3 
  AND date >= '2025-10-01' 
  AND date <= '2025-10-31';