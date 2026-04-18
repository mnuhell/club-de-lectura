-- Chat between matched readers + message notifications

-- Cleanup for idempotency
DROP TRIGGER IF EXISTS on_message_insert ON messages;
DROP FUNCTION IF EXISTS notify_on_message();
DROP TABLE IF EXISTS messages CASCADE;

-- 1. messages table
CREATE TABLE messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid        NOT NULL REFERENCES reader_matches(id) ON DELETE CASCADE,
  sender_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    text        NOT NULL CHECK (content != ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at    timestamptz
);

CREATE INDEX messages_match_created_idx ON messages(match_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match members can read messages" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reader_matches
      WHERE id = match_id
        AND (user_1_id = auth.uid() OR user_2_id = auth.uid())
    )
  );

CREATE POLICY "match members can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM reader_matches
      WHERE id = match_id
        AND (user_1_id = auth.uid() OR user_2_id = auth.uid())
    )
  );

-- 2. extend notifications (messages table now exists)
ALTER TABLE notifications
  ALTER COLUMN post_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS message_id uuid REFERENCES messages(id) ON DELETE CASCADE;

-- 3. trigger: notify recipient on new message
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id uuid;
BEGIN
  SELECT CASE
    WHEN user_1_id = NEW.sender_id THEN user_2_id
    ELSE user_1_id
  END INTO v_recipient_id
  FROM reader_matches
  WHERE id = NEW.match_id;

  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, actor_id, message_id, type)
    VALUES (v_recipient_id, NEW.sender_id, NEW.id, 'message');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_message();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
