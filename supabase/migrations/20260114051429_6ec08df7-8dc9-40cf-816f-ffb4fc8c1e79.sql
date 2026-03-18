-- Remove the profiles_public view since profiles table already has proper RLS
-- This view was causing security warnings due to missing RLS policies
DROP VIEW IF EXISTS public.profiles_public;