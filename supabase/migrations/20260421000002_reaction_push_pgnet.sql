-- Direct push notification via pg_net when a reaction notification is inserted.
-- Calls Expo push API directly — no edge function or Dashboard webhook needed.
-- pg_net is already enabled (used for on_message_push).

CREATE OR REPLACE FUNCTION public.on_notification_push()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_push_token text;
  v_actor_name text;
  v_emoji      text;
BEGIN
  SELECT push_token INTO v_push_token
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF v_push_token IS NULL OR v_push_token NOT LIKE 'ExponentPushToken%' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username, 'Alguien') INTO v_actor_name
  FROM public.profiles
  WHERE id = NEW.actor_id;

  v_emoji := COALESCE(NEW.emoji, '👍');

  PERFORM net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb,
    body    := jsonb_build_object(
      'to',    v_push_token,
      'title', 'Folio',
      'body',  v_actor_name || ' reaccionó con ' || v_emoji || ' a tu comentario',
      'sound', 'default',
      'data',  jsonb_build_object('postId', NEW.post_id, 'screen', 'feed')
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_notification_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.on_notification_push();
