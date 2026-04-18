-- Add push token to profiles for Expo push notifications
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token text;

-- Allow users to update their own push token
CREATE POLICY "users can update own push token" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
