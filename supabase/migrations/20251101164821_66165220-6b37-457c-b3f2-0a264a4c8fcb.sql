-- Fix security issue: Prevent unauthorized modification of subscription records
-- Subscriptions contain sensitive financial data and should only be managed by admins

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
  DROP POLICY IF EXISTS "Authenticated users can view their own subscription" ON public.subscriptions;
END $$;

-- Allow users to view only their own subscription
CREATE POLICY "Authenticated users can view their own subscription" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Only admins can manage subscriptions (create, update, delete)
CREATE POLICY "Only admins can create subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));