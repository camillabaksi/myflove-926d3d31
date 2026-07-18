
-- 1) user_roles: explicit admin-only write policies
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) friction_items: restrict raw SELECT to reporter + admin
DROP POLICY IF EXISTS "Authenticated can read friction items" ON public.friction_items;

CREATE POLICY "Reporter or admin can read friction items" ON public.friction_items
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) friction_votes: restrict raw SELECT to own vote + admin
DROP POLICY IF EXISTS "Authenticated can read votes" ON public.friction_votes;

CREATE POLICY "Own vote or admin can read votes" ON public.friction_votes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) Anonymized board RPC so the collaborative feedback UI keeps working
--    Returns items + aggregated vote counts, without exposing other users' reporter_id.
CREATE OR REPLACE FUNCTION public.get_friction_board()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  impact smallint,
  frequency smallint,
  mental_load smallint,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  is_mine boolean,
  vote_count bigint,
  has_voted boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fi.id,
    fi.title,
    fi.description,
    fi.category,
    fi.impact,
    fi.frequency,
    fi.mental_load,
    fi.status,
    fi.created_at,
    fi.updated_at,
    (fi.reporter_id = auth.uid()) AS is_mine,
    COALESCE(vc.cnt, 0) AS vote_count,
    EXISTS (
      SELECT 1 FROM public.friction_votes v
      WHERE v.item_id = fi.id AND v.user_id = auth.uid()
    ) AS has_voted
  FROM public.friction_items fi
  LEFT JOIN (
    SELECT item_id, COUNT(*)::bigint AS cnt
    FROM public.friction_votes
    GROUP BY item_id
  ) vc ON vc.item_id = fi.id
  WHERE auth.uid() IS NOT NULL
  ORDER BY fi.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_friction_board() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friction_board() TO authenticated;

-- 5) Tighten has_role EXECUTE (linter finding)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
-- RLS policies referencing has_role continue to work because policy expressions
-- are evaluated with the policy owner's rights, not the caller's EXECUTE grant.
