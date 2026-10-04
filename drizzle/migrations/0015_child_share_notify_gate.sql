-- Ägaren av en delad barnaktivitet väljer själv vilka mottagare som får notiser.
ALTER TABLE public.child_item_shares ADD COLUMN notify boolean NOT NULL DEFAULT false;

-- share_child_item skriver om delningslistan; bevara befintliga notify-val.
CREATE OR REPLACE FUNCTION public.share_child_item(_item_id uuid, _user_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
BEGIN
  SELECT owner_id INTO _owner FROM public.child_items WHERE id = _item_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  DELETE FROM public.child_item_shares
  WHERE item_id = _item_id AND NOT (user_id = ANY(_user_ids));
  INSERT INTO public.child_item_shares (item_id, user_id)
  SELECT _item_id, u FROM unnest(_user_ids) AS u
  ON CONFLICT (item_id, user_id) DO NOTHING;
END;
$$;

-- Ägaren slår på/av notiser för en specifik mottagare av en delad aktivitet.
CREATE OR REPLACE FUNCTION public.set_child_item_share_notify(_item_id uuid, _user_id uuid, _notify boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
BEGIN
  SELECT owner_id INTO _owner FROM public.child_items WHERE id = _item_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  UPDATE public.child_item_shares
  SET notify = _notify
  WHERE item_id = _item_id AND user_id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_child_item_share_notify(uuid, uuid, boolean) TO authenticated;