-- Actualiza get_club_members para incluir datos de perfil de cada miembro
DROP FUNCTION IF EXISTS public.get_club_members(uuid);

CREATE OR REPLACE FUNCTION public.get_club_members(p_club_id uuid)
RETURNS TABLE (
  club_id     uuid,
  user_id     uuid,
  role        public.club_role,
  joined_at   timestamptz,
  display_name text,
  username    text,
  avatar_url  text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_members.club_id = p_club_id AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      cm.club_id,
      cm.user_id,
      cm.role,
      cm.joined_at,
      p.display_name,
      p.username,
      p.avatar_url
    FROM public.club_members cm
    LEFT JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.club_id = p_club_id
    ORDER BY
      CASE cm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
      cm.joined_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_club_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_members(uuid) TO anon;
