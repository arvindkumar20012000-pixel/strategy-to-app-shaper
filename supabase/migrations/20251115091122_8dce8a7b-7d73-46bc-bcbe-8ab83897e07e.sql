-- Add language column to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'english';

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_articles_language ON public.articles(language);