CREATE TABLE public.flow_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Ny chatt',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.flow_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.flow_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX flow_conversations_user_idx ON public.flow_conversations (user_id, updated_at DESC);
CREATE INDEX flow_messages_conv_idx ON public.flow_messages (conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_conversations TO authenticated;
GRANT ALL ON public.flow_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_messages TO authenticated;
GRANT ALL ON public.flow_messages TO service_role;

ALTER TABLE public.flow_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own conversations" ON public.flow_conversations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own messages" ON public.flow_messages
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER flow_conversations_set_updated_at
  BEFORE UPDATE ON public.flow_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();