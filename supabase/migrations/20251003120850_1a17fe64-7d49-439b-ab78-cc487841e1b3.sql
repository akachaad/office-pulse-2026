-- Add start_date column to People table
ALTER TABLE public."People" 
ADD COLUMN start_date date;

-- Update RLS policy to allow HR and admins to insert people
CREATE POLICY "Admins and HR can insert people"
ON public."People"
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));