-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  actor_id   UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES public.posts(id)     ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'reaction',
  emoji      TEXT,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: auto-create notification when a reaction is inserted (skip self-reactions)
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id UUID;
BEGIN
  SELECT author_id INTO v_author_id FROM public.posts WHERE id = NEW.post_id;
  IF v_author_id IS NOT NULL AND v_author_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, post_id, type, emoji)
    VALUES (v_author_id, NEW.user_id, NEW.post_id, 'reaction', NEW.emoji);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reaction_insert
  AFTER INSERT ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_reaction();
