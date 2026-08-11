-- Children module: private per user, shareable per item with chosen family members

CREATE TABLE public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birthdate date,
  color text NOT NULL DEFAULT '#c17a56',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.child_shares (
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, user_id)
);

CREATE TABLE public.child_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note' CHECK (kind IN ('activity','task','note','doc')),
  title text NOT NULL,
  notes text,
  date date,
  time text,
  completed boolean NOT NULL DEFAULT false,
  remind boolean NOT NULL DEFAULT false,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.child_item_shares (
  item_id uuid NOT NULL REFERENCES public.child_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, user_id)
);

CREATE INDEX idx_child_items_child ON public.child_items(child_id);
CREATE INDEX idx_child_item_shares_user ON public.child_item_shares(user_id);
CREATE INDEX idx_child_shares_user ON public.child_shares(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_shares TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_item_shares TO authenticated;
GRANT ALL ON public.children TO service_role;
GRANT ALL ON public.child_items TO service_role;
GRANT ALL ON public.child_shares TO service_role;
GRANT ALL ON public.child_item_shares TO service_role;

-- Helpers (security definer, avoids recursive policy evaluation)
CREATE OR REPLACE FUNCTION public.child_owner(_child_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner_id FROM public.children WHERE id = _child_id
$$;

CREATE OR REPLACE FUNCTION public.child_item_owner(_item_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner_id FROM public.child_items WHERE id = _item_id
$$;

CREATE OR REPLACE FUNCTION public.can_view_child(_child_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.children c WHERE c.id = _child_id AND c.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.child_shares s WHERE s.child_id = _child_id AND s.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.can_view_child_item(_item_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.child_items i WHERE i.id = _item_id AND i.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = _item_id AND s.user_id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.child_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.child_item_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_child(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_child_item(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.child_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.child_item_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_child(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_child_item(uuid, uuid) TO authenticated;

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_item_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own children" ON public.children FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Shared users can view child" ON public.children FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.child_shares s WHERE s.child_id = id AND s.user_id = auth.uid()));

CREATE POLICY "Owner manages own child items" ON public.child_items FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND public.child_owner(child_id) = auth.uid());
CREATE POLICY "Shared users can view child items" ON public.child_items FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = id AND s.user_id = auth.uid()));

CREATE POLICY "Owner manages child shares" ON public.child_shares FOR ALL TO authenticated
  USING (public.child_owner(child_id) = auth.uid()) WITH CHECK (public.child_owner(child_id) = auth.uid());
CREATE POLICY "Recipient can view own child share" ON public.child_shares FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.child_owner(child_id) = auth.uid());

CREATE POLICY "Owner manages child item shares" ON public.child_item_shares FOR ALL TO authenticated
  USING (public.child_item_owner(item_id) = auth.uid()) WITH CHECK (public.child_item_owner(item_id) = auth.uid());
CREATE POLICY "Recipient can view own child item share" ON public.child_item_shares FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.child_item_owner(item_id) = auth.uid());

CREATE TRIGGER trg_children_updated_at BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_child_items_updated_at BEFORE UPDATE ON public.child_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sharing an item also reveals the child profile it belongs to
CREATE OR REPLACE FUNCTION public.share_child_item(_item_id uuid, _user_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid;
BEGIN
  SELECT child_id INTO _cid FROM public.child_items WHERE id = _item_id AND owner_id = auth.uid();
  IF _cid IS NULL THEN RAISE EXCEPTION 'not allowed'; END IF;
  DELETE FROM public.child_item_shares WHERE item_id = _item_id AND NOT (user_id = ANY(_user_ids));
  INSERT INTO public.child_item_shares (item_id, user_id)
    SELECT _item_id, u FROM unnest(_user_ids) u
    ON CONFLICT DO NOTHING;
  INSERT INTO public.child_shares (child_id, user_id)
    SELECT _cid, u FROM unnest(_user_ids) u
    ON CONFLICT DO NOTHING;
END $$;

REVOKE EXECUTE ON FUNCTION public.share_child_item(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.share_child_item(uuid, uuid[]) TO authenticated;