-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'employee');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop all existing policies on People table
DROP POLICY IF EXISTS "Everyone can view people" ON public."People";
DROP POLICY IF EXISTS "Allow updates to People records" ON public."People";
DROP POLICY IF EXISTS "Authenticated users can view people" ON public."People";
DROP POLICY IF EXISTS "Authenticated users can update people" ON public."People";

-- Create new role-based policies for People table
CREATE POLICY "Authenticated users can view people"
ON public."People"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and HR can update people"
ON public."People"
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'hr')
);

-- Drop all existing policies on attendance table
DROP POLICY IF EXISTS "Everyone can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Everyone can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Everyone can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Everyone can delete attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can delete attendance" ON public.attendance;

-- Create new role-based policies for attendance table
CREATE POLICY "Authenticated users can view attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and HR can insert attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'hr')
);

CREATE POLICY "Admins and HR can update attendance"
ON public.attendance
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'hr')
);

CREATE POLICY "Admins and HR can delete attendance"
ON public.attendance
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'hr')
);