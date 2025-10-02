-- Add user_id column to People table to link people to users
ALTER TABLE public."People" 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_people_user_id ON public."People"(user_id);

-- Update MPE trigramme to be associated with the specified user_id
UPDATE public."People" 
SET user_id = 'ddda4c45-8d15-4865-a991-b24ac9831c63'
WHERE trigramme = 'MPE';