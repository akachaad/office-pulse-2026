-- Security Fix: Restrict SELECT access on People and attendance tables
-- Retrying after deadlock

-- Update People table SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view people" ON public."People";

CREATE POLICY "Only admins and HR can view people"
ON public."People"
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
);

-- Update attendance table SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;

CREATE POLICY "Only admins and HR can view attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
);