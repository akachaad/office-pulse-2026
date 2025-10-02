-- Add period column to attendance table to support half-day tracking
ALTER TABLE public.attendance 
ADD COLUMN period TEXT NOT NULL DEFAULT 'full_day' 
CHECK (period IN ('full_day', 'morning', 'afternoon'));

-- Drop the existing unique constraint on (person_id, date)
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_person_id_date_key;

-- Add new unique constraint on (person_id, date, period)
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_person_id_date_period_key UNIQUE (person_id, date, period);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_person_date_period 
ON public.attendance(person_id, date, period);