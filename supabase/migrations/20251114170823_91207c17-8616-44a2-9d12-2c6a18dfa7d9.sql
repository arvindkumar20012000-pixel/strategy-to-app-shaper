-- Create storage bucket for NCERT PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ncert-pdfs', 'ncert-pdfs', true);

-- Create storage policies for NCERT PDFs
CREATE POLICY "Anyone can view NCERT PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'ncert-pdfs');

CREATE POLICY "Admins can upload NCERT PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ncert-pdfs' AND auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));