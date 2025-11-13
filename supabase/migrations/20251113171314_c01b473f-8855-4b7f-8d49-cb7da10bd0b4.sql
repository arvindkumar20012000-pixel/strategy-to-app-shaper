-- Create notifications table for admin to send notifications to users
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  target_audience text NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can view active notifications
CREATE POLICY "Anyone can view active notifications"
ON public.notifications
FOR SELECT
USING (is_active = true);

-- Only admins can manage notifications
CREATE POLICY "Admins can manage notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Clean old articles (older than 7 days)
CREATE OR REPLACE FUNCTION clean_old_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.articles
  WHERE published_date < CURRENT_DATE - INTERVAL '7 days';
END;
$$;