-- Add explicit INSERT denial policy for anonymous users on organization_settings
CREATE POLICY "Deny anonymous insert to organization_settings" 
ON public.organization_settings 
FOR INSERT 
TO anon 
WITH CHECK (false);