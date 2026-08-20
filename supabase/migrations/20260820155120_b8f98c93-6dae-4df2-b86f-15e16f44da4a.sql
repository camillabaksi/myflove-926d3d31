ALTER TABLE public.energy_factors ADD COLUMN IF NOT EXISTS dedup_key text;

CREATE OR REPLACE FUNCTION public.energy_factors_set_dedup_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.dedup_key :=
    lower(btrim(NEW.title)) || '|' || NEW.direction || '|' ||
    to_char(date_trunc('minute', NEW.occurred_at AT TIME ZONE 'UTC'), 'YYYYMMDDHH24MI');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_energy_factors_dedup_key ON public.energy_factors;
CREATE TRIGGER trg_energy_factors_dedup_key
BEFORE INSERT OR UPDATE OF title, direction, occurred_at ON public.energy_factors
FOR EACH ROW EXECUTE FUNCTION public.energy_factors_set_dedup_key();

UPDATE public.energy_factors
SET dedup_key = lower(btrim(title)) || '|' || direction || '|' ||
  to_char(date_trunc('minute', occurred_at AT TIME ZONE 'UTC'), 'YYYYMMDDHH24MI')
WHERE dedup_key IS NULL;

-- Rensa eventuella redan existerande dubbletter innan unikt index skapas
DELETE FROM public.energy_factors a
USING public.energy_factors b
WHERE a.user_id = b.user_id
  AND a.dedup_key = b.dedup_key
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS energy_factors_user_dedup_key_idx
  ON public.energy_factors (user_id, dedup_key);