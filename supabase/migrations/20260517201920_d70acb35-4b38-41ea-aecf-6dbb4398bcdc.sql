-- Atomic view increment function
CREATE OR REPLACE FUNCTION public.increment_news_views(news_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.news
    SET views = views + 1
    WHERE id = news_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix has_role function security
ALTER FUNCTION public.has_role(UUID, public.app_role) SET search_path = public;
