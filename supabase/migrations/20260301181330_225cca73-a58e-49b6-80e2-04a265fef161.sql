
-- Add is_email_verified to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_email_verified boolean NOT NULL DEFAULT false;

-- Create email verification codes table
CREATE TABLE public.email_verification_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for quick lookup
CREATE INDEX idx_verification_codes_user_email ON public.email_verification_codes(user_id, email);
CREATE INDEX idx_verification_codes_expires ON public.email_verification_codes(expires_at);

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own codes
CREATE POLICY "Users can view own verification codes"
  ON public.email_verification_codes
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own codes
CREATE POLICY "Users can insert own verification codes"
  ON public.email_verification_codes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own codes
CREATE POLICY "Users can update own verification codes"
  ON public.email_verification_codes
  FOR UPDATE
  USING (user_id = auth.uid());
