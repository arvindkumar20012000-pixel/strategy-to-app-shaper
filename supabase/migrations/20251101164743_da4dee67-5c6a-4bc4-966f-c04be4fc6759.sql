-- Fix security issues: Ensure only authenticated users can access sensitive data
-- This migration safely updates RLS policies

-- For profiles table: Ensure explicit authentication check
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
END $$;

-- Create profiles policies with explicit authentication checks
CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- For admin_settings table: Restrict to admin-only access
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
  DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_settings;
  DROP POLICY IF EXISTS "Admins can insert settings" ON public.admin_settings;
  DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_settings;
  DROP POLICY IF EXISTS "Admins can delete settings" ON public.admin_settings;
END $$;

-- Create granular admin_settings policies
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

-- For wallets table: Ensure explicit authentication check for financial data
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
  DROP POLICY IF EXISTS "Authenticated users can view their own wallet" ON public.wallets;
END $$;

CREATE POLICY "Authenticated users can view their own wallet" 
ON public.wallets 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);