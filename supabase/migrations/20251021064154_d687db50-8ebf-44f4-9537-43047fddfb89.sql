-- Drop existing attendance policies
DROP POLICY IF EXISTS "Admins and HR can delete attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins and HR can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins and HR can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Only admins and HR can view attendance" ON public.attendance;

-- Create new policies with date restrictions for non-admin users
-- SELECT: Everyone (admin/HR) can view all attendance
CREATE POLICY "Admins and HR can view all attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
);

-- INSERT: Admins and HR can insert any attendance
CREATE POLICY "Admins and HR can insert all attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
);

-- UPDATE: Admins can update any attendance, HR can only update present/future
CREATE POLICY "Admins can update all attendance"
ON public.attendance
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR can update present and future attendance"
ON public.attendance
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'hr'::app_role) AND 
  date >= CURRENT_DATE
)
WITH CHECK (
  has_role(auth.uid(), 'hr'::app_role) AND 
  date >= CURRENT_DATE
);

-- DELETE: Admins can delete any attendance, HR can only delete present/future
CREATE POLICY "Admins can delete all attendance"
ON public.attendance
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR can delete present and future attendance"
ON public.attendance
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'hr'::app_role) AND 
  date >= CURRENT_DATE
);