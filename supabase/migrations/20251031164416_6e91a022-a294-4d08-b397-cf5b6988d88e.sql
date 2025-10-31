-- Add exam categories table
CREATE TABLE IF NOT EXISTS public.exam_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.exam_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exam categories"
ON public.exam_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage exam categories"
ON public.exam_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add admin settings table for API keys
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
ON public.admin_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add exam_type to mock_tests and previous_papers
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS exam_type UUID REFERENCES public.exam_categories(id);
ALTER TABLE public.previous_papers ADD COLUMN IF NOT EXISTS exam_type UUID REFERENCES public.exam_categories(id);

-- Update RLS policies for admin management
CREATE POLICY "Admins can manage mock tests"
ON public.mock_tests FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage previous papers"
ON public.previous_papers FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage questions"
ON public.questions FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage NCERT content"
ON public.ncert_content FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add unique constraint to articles title for upsert
ALTER TABLE public.articles ADD CONSTRAINT articles_title_key UNIQUE (title);

-- Add triggers for updated_at
CREATE TRIGGER update_exam_categories_updated_at
BEFORE UPDATE ON public.exam_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default exam categories
INSERT INTO public.exam_categories (name, description) VALUES
('SSC', 'Staff Selection Commission exams'),
('Railway', 'Railway Recruitment Board exams'),
('Banking', 'IBPS and other banking exams'),
('UPSC', 'Union Public Service Commission exams'),
('State PSC', 'State Public Service Commission exams'),
('Defence', 'NDA, CDS and other defence exams')
ON CONFLICT (name) DO NOTHING;