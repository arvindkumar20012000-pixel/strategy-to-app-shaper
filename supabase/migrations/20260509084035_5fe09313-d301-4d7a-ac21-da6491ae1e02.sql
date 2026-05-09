CREATE OR REPLACE FUNCTION public.clean_old_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.articles
  WHERE published_date < CURRENT_DATE - INTERVAL '2 days';
END;
$function$;