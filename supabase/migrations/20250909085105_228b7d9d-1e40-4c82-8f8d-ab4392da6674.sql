-- Allow updates to People table for admin functionality
CREATE POLICY "Allow updates to People records" 
ON public."People" 
FOR UPDATE 
USING (true);