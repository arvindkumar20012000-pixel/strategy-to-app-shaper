-- Add UPDATE policy for test_attempts table so users can submit their tests
CREATE POLICY "Users can update their own attempts"
ON public.test_attempts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);