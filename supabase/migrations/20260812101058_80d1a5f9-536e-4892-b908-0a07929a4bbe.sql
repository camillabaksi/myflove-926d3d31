ALTER TABLE public.children REPLICA IDENTITY FULL;
ALTER TABLE public.child_items REPLICA IDENTITY FULL;
ALTER TABLE public.child_item_shares REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='children') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.children;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='child_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.child_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='child_item_shares') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.child_item_shares;
  END IF;
END $$;