CREATE TABLE public.family_share_areas (
  user_id uuid NOT NULL,
  area text NOT NULL CHECK (area IN ('kalender','uppgifter','inkop','rutiner')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, area)
);
GRANT SELECT, INSERT, DELETE ON public.family_share_areas TO authenticated;
GRANT ALL ON public.family_share_areas TO service_role;
ALTER TABLE public.family_share_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own share areas select" ON public.family_share_areas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own share areas insert" ON public.family_share_areas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own share areas delete" ON public.family_share_areas FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_family_shared_data()
RETURNS TABLE(owner_id uuid, display_name text, color text, area text, key text, value jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH mine AS (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  ), others AS (
    SELECT DISTINCT ON (hm.user_id) hm.user_id, hm.display_name, hm.color
    FROM public.household_members hm
    WHERE hm.household_id IN (SELECT household_id FROM mine) AND hm.user_id <> auth.uid()
  ), keymap(area, key) AS (
    VALUES ('kalender','myflow-tasks'), ('kalender','myflow-reminders'),
           ('uppgifter','myflow-tasks'),
           ('inkop','myflow-shopping'), ('inkop','myflow-meal-plans'),
           ('rutiner','myflove-routines'), ('rutiner','myflove-medications'), ('rutiner','myflove-medication-log')
  )
  SELECT o.user_id, o.display_name, o.color, fsa.area, kv.key, kv.value
  FROM others o
  JOIN public.family_share_areas fsa ON fsa.user_id = o.user_id
  JOIN keymap km ON km.area = fsa.area
  JOIN public.user_kv kv ON kv.user_id = o.user_id AND kv.key = km.key
  WHERE auth.uid() IS NOT NULL
$$;
REVOKE EXECUTE ON FUNCTION public.get_family_shared_data() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_family_shared_data() TO authenticated;