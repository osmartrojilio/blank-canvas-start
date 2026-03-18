-- Fix: Users can insert profiles with arbitrary organization_id
-- Since profile creation is handled by the handle_new_user() trigger,
-- we should block all manual profile insertions

-- Drop the current policy that allows manual inserts
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a policy that blocks all manual inserts
-- Profile creation is handled exclusively by the signup trigger (SECURITY DEFINER)
CREATE POLICY "Profiles created only by trigger"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (false);