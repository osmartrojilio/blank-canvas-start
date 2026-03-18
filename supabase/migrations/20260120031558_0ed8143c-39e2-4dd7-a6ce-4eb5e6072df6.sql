-- Create invitations table for user invites
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'driver',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations in their organization
CREATE POLICY "Admins can manage invitations"
ON public.invitations
FOR ALL
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.invitations
FOR SELECT
USING (true);

-- Create index for faster token lookups
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Function to accept invitation and create user role
CREATE OR REPLACE FUNCTION public.accept_invitation(_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User must be authenticated');
  END IF;
  
  -- Get current user email
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
  
  -- Find invitation
  SELECT * INTO invitation_record FROM public.invitations 
  WHERE token = _token 
    AND accepted_at IS NULL 
    AND expires_at > now();
  
  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Verify email matches
  IF LOWER(invitation_record.email) != LOWER(current_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email does not match invitation');
  END IF;
  
  -- Check if user already has a profile with organization
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id AND organization_id IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already belongs to an organization');
  END IF;
  
  -- Update or create profile with organization
  INSERT INTO public.profiles (id, organization_id, is_owner)
  VALUES (current_user_id, invitation_record.organization_id, false)
  ON CONFLICT (id) DO UPDATE SET organization_id = invitation_record.organization_id;
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (current_user_id, invitation_record.organization_id, invitation_record.role)
  ON CONFLICT DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE public.invitations SET accepted_at = now() WHERE id = invitation_record.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
END;
$$;