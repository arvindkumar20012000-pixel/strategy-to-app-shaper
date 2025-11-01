-- Fix security issue: Explicitly deny unauthenticated access to profiles table
-- The profiles table contains sensitive PII (email, phone) and must only be accessible to authenticated users

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate policies with explicit authentication checks
CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Fix security issue: Restrict admin_settings table to admin-only access
-- This table may contain sensitive configuration like API keys

DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;

-- Create separate policies for better security control
CREATE POLICY "Admins can view settings" 
ON public.admin_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings" 
ON public.admin_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings" 
ON public.admin_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete settings" 
ON public.admin_settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));