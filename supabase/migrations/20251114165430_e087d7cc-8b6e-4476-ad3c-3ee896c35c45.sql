-- Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true);

-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Policies for banners
CREATE POLICY "Anyone can view active banners"
ON public.banners
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage banners"
ON public.banners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for banners
CREATE POLICY "Anyone can view banner images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banner images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update banner images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banner images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for article images
CREATE POLICY "Anyone can view article images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Admins can upload article images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'article-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete article images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'article-images' AND has_role(auth.uid(), 'admin'::app_role));