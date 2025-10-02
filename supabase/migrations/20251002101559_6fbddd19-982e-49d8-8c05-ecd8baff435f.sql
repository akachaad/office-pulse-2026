-- Create table for recurrent attendance patterns
CREATE TABLE public.recurrent_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id bigint NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(person_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.recurrent_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for recurrent_attendance
CREATE POLICY "Admins and HR can view recurrent attendance"
ON public.recurrent_attendance
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Admins and HR can insert recurrent attendance"
ON public.recurrent_attendance
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Admins and HR can update recurrent attendance"
ON public.recurrent_attendance
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Admins and HR can delete recurrent attendance"
ON public.recurrent_attendance
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recurrent_attendance_updated_at
BEFORE UPDATE ON public.recurrent_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.recurrent_attendance IS 'Stores recurrent attendance patterns for specific days of the week. Day 0=Sunday, 1=Monday, ..., 6=Saturday';