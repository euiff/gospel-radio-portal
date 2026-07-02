
ALTER TABLE public.top_songs
  ADD COLUMN IF NOT EXISTS week_start date,
  ADD COLUMN IF NOT EXISTS week_end date;

CREATE OR REPLACE FUNCTION public.reset_top_chart_week(_start date, _end date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.top_songs
    SET votes = 0, week_start = _start, week_end = _end
    WHERE active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_top_chart_week(date, date) TO authenticated;
