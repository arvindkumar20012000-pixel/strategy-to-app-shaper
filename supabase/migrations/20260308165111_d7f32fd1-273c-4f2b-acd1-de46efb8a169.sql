
CREATE TABLE public.dismissed_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  dismissed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

ALTER TABLE public.dismissed_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dismissals"
  ON public.dismissed_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss notifications"
  ON public.dismissed_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can undo dismissals"
  ON public.dismissed_notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
