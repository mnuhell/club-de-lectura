-- Reader matching feature: "Tinder para lectores"
-- Photo is revealed ONLY after a mutual match based on literary taste
-- Idempotent: drops and recreates all objects cleanly

-- Drop functions first (they reference the tables)
DROP FUNCTION IF EXISTS get_discoverable_readers(uuid, text, int);
DROP FUNCTION IF EXISTS swipe_reader(uuid, uuid, text);
DROP FUNCTION IF EXISTS get_my_matches(uuid);

-- Drop tables (CASCADE removes policies and indexes automatically)
DROP TABLE IF EXISTS reader_matches CASCADE;
DROP TABLE IF EXISTS reader_swipes CASCADE;
DROP TABLE IF EXISTS reader_genres CASCADE;

-- Extend profiles with matching fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS reader_bio text,
  ADD COLUMN IF NOT EXISTS matching_enabled boolean DEFAULT true NOT NULL;

-- Literary genre preferences (many per user)
CREATE TABLE reader_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  genre text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, genre),
  CHECK (genre != '')
);

-- Swipe actions (like / pass)
CREATE TABLE reader_swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  swiped_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('like', 'pass')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(swiper_id, swiped_id),
  CHECK (swiper_id != swiped_id)
);

-- Mutual matches (created when both users like each other)
CREATE TABLE reader_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_2_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_1_id, user_2_id),
  CHECK (user_1_id < user_2_id)
);

-- Indexes
CREATE INDEX reader_genres_user_id_idx ON reader_genres(user_id);
CREATE INDEX reader_swipes_swiper_idx ON reader_swipes(swiper_id);
CREATE INDEX reader_swipes_swiped_idx ON reader_swipes(swiped_id);
CREATE INDEX reader_matches_user1_idx ON reader_matches(user_1_id);
CREATE INDEX reader_matches_user2_idx ON reader_matches(user_2_id);

-- RLS
ALTER TABLE reader_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE reader_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reader_matches ENABLE ROW LEVEL SECURITY;

-- reader_genres policies
CREATE POLICY "authenticated can read genres" ON reader_genres
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "users manage own genres" ON reader_genres
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- reader_swipes policies
CREATE POLICY "users manage own swipes" ON reader_swipes
  FOR ALL TO authenticated USING (auth.uid() = swiper_id)
  WITH CHECK (auth.uid() = swiper_id);

-- reader_matches policies
CREATE POLICY "users read own matches" ON reader_matches
  FOR SELECT TO authenticated
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- RPC: get discoverable readers ordered by shared genres (no avatar revealed)
CREATE OR REPLACE FUNCTION get_discoverable_readers(
  p_user_id uuid,
  p_city text DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  full_name text,
  city text,
  reader_bio text,
  genres text[],
  shared_genre_count bigint
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(p.display_name, p.username) AS full_name,
    p.city,
    p.reader_bio,
    ARRAY_AGG(DISTINCT rg.genre) FILTER (WHERE rg.genre IS NOT NULL) AS genres,
    COUNT(DISTINCT CASE
      WHEN rg.genre IN (SELECT genre FROM reader_genres WHERE user_id = p_user_id)
      THEN rg.genre
    END) AS shared_genre_count
  FROM profiles p
  LEFT JOIN reader_genres rg ON rg.user_id = p.id
  WHERE
    p.id != p_user_id
    AND p.matching_enabled = true
    AND (p_city IS NULL OR LOWER(p.city) = LOWER(p_city))
    AND p.id NOT IN (
      SELECT swiped_id FROM reader_swipes WHERE swiper_id = p_user_id
    )
    AND p.id NOT IN (
      SELECT CASE WHEN user_1_id = p_user_id THEN user_2_id ELSE user_1_id END
      FROM reader_matches
      WHERE user_1_id = p_user_id OR user_2_id = p_user_id
    )
  GROUP BY p.id, p.display_name, p.username, p.city, p.reader_bio
  ORDER BY shared_genre_count DESC, p.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_discoverable_readers TO authenticated;

-- RPC: swipe + auto-create match if mutual like. Returns match id or null.
CREATE OR REPLACE FUNCTION swipe_reader(
  p_swiper_id uuid,
  p_swiped_id uuid,
  p_action text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id uuid;
  v_user_1 uuid;
  v_user_2 uuid;
BEGIN
  INSERT INTO reader_swipes (swiper_id, swiped_id, action)
  VALUES (p_swiper_id, p_swiped_id, p_action)
  ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET action = p_action;

  IF p_action = 'like' THEN
    IF EXISTS (
      SELECT 1 FROM reader_swipes
      WHERE swiper_id = p_swiped_id AND swiped_id = p_swiper_id AND action = 'like'
    ) THEN
      v_user_1 := LEAST(p_swiper_id, p_swiped_id);
      v_user_2 := GREATEST(p_swiper_id, p_swiped_id);

      INSERT INTO reader_matches (user_1_id, user_2_id)
      VALUES (v_user_1, v_user_2)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_match_id;
    END IF;
  END IF;

  RETURN v_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION swipe_reader TO authenticated;

-- RPC: get my matches with avatar revealed
CREATE OR REPLACE FUNCTION get_my_matches(p_user_id uuid)
RETURNS TABLE (
  match_id uuid,
  matched_at timestamptz,
  reader_id uuid,
  full_name text,
  city text,
  reader_bio text,
  avatar_url text,
  genres text[]
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id AS match_id,
    m.created_at AS matched_at,
    p.id AS reader_id,
    COALESCE(p.display_name, p.username) AS full_name,
    p.city,
    p.reader_bio,
    p.avatar_url,
    ARRAY_AGG(DISTINCT rg.genre) FILTER (WHERE rg.genre IS NOT NULL) AS genres
  FROM reader_matches m
  JOIN profiles p ON p.id = CASE
    WHEN m.user_1_id = p_user_id THEN m.user_2_id
    ELSE m.user_1_id
  END
  LEFT JOIN reader_genres rg ON rg.user_id = p.id
  WHERE m.user_1_id = p_user_id OR m.user_2_id = p_user_id
  GROUP BY m.id, m.created_at, p.id, p.display_name, p.username, p.city, p.reader_bio, p.avatar_url
  ORDER BY m.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_my_matches TO authenticated;
