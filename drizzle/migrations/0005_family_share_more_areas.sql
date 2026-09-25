ALTER TABLE public.family_share_areas DROP CONSTRAINT IF EXISTS family_share_areas_area_check;
ALTER TABLE public.family_share_areas ADD CONSTRAINT family_share_areas_area_check CHECK (area IN ('kalender','uppgifter','inkop','rutiner','traning','maende','ekonomi','studier','jobb','anteckningar','resor'));

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
           ('rutiner','myflove-routines'), ('rutiner','myflove-medications'), ('rutiner','myflove-medication-log'),
           ('traning','myflove-training'),
           ('maende','myflow-moods'), ('maende','myflove-energy-log'),
           ('ekonomi','myflove-budget'), ('ekonomi','myflow-finances'),
           ('studier','myflove-courses'), ('studier','myflove-flowstudy'),
           ('jobb','myflove-work-projects'),
           ('anteckningar','myflow-dump-ideas'),
           ('resor','myflow-saved-trips')
  )
  SELECT o.user_id, o.display_name, o.color, fsa.area, kv.key, kv.value
  FROM others o
  JOIN public.family_share_areas fsa ON fsa.user_id = o.user_id
  JOIN keymap km ON km.area = fsa.area
  JOIN public.user_kv kv ON kv.user_id = o.user_id AND kv.key = km.key
  WHERE auth.uid() IS NOT NULL
$$;