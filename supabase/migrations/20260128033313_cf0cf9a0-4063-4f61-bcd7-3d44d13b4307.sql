-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id = auth.uid());

-- Allow system to insert notifications (via trigger)
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify admins when invitation is accepted
CREATE OR REPLACE FUNCTION public.notify_invitation_accepted()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  invitee_name TEXT;
BEGIN
  -- Only trigger when accepted_at changes from NULL to a value
  IF OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL THEN
    -- Get the name of the person who accepted
    SELECT full_name INTO invitee_name
    FROM public.profiles
    WHERE id = (
      SELECT id FROM public.profiles 
      WHERE organization_id = NEW.organization_id 
      ORDER BY created_at DESC 
      LIMIT 1
    );
    
    IF invitee_name IS NULL THEN
      invitee_name := NEW.email;
    END IF;
    
    -- Notify all admins in the organization
    FOR admin_record IN
      SELECT ur.user_id
      FROM public.user_roles ur
      WHERE ur.organization_id = NEW.organization_id
      AND ur.role = 'admin'
    LOOP
      INSERT INTO public.notifications (
        organization_id,
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        NEW.organization_id,
        admin_record.user_id,
        'invitation_accepted',
        'Novo usuário na equipe',
        invitee_name || ' aceitou o convite e entrou na sua organização.',
        jsonb_build_object(
          'email', NEW.email,
          'role', NEW.role,
          'invited_by', NEW.invited_by
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on invitations table
CREATE TRIGGER on_invitation_accepted
AFTER UPDATE ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.notify_invitation_accepted();

-- Create index for faster queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;