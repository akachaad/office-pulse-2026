-- First, let's add RLS policies to the People table (note the capital P)
ALTER TABLE public."People" ENABLE ROW LEVEL SECURITY;

-- Create policies for the People table (public read access for now)
CREATE POLICY "Everyone can view people" 
ON public."People" 
FOR SELECT 
USING (true);

-- Create attendance table to track attendance data
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id BIGINT NOT NULL REFERENCES public."People"(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'sickness', 'holidays', 'training', 'homeworking')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(person_id, date)
);

-- Enable RLS on attendance table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance table (public read access for now)
CREATE POLICY "Everyone can view attendance" 
ON public.attendance 
FOR SELECT 
USING (true);

CREATE POLICY "Everyone can insert attendance" 
ON public.attendance 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Everyone can update attendance" 
ON public.attendance 
FOR UPDATE 
USING (true);

CREATE POLICY "Everyone can delete attendance" 
ON public.attendance 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_attendance_person_date ON public.attendance(person_id, date);
CREATE INDEX idx_attendance_date ON public.attendance(date);