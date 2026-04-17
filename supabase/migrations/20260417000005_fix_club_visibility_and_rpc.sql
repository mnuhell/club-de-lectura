-- Fix 1: clubs SELECT policy — allow non-owner members to see their clubs.
-- Since club_members SELECT is now just "auth.uid() = user_id" (no clubs back-ref),
-- adding an EXISTS on club_members here is safe — no cycle.
drop policy if exists "Public clubs are viewable by everyone" on public.clubs;
create policy "Members and public can view clubs"
  on public.clubs for select
  using (
    is_private = false
    or owner_id = auth.uid()
    or exists (
      select 1 from public.club_members
      where club_id = id and user_id = auth.uid()
    )
  );

-- Fix 2: re-create get_club_members as plpgsql so we can set row_security = off
-- and grant execute explicitly to authenticated role.
drop function if exists public.get_club_members(uuid);

create or replace function public.get_club_members(p_club_id uuid)
returns setof public.club_members
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  -- Only return members if caller is themselves a member
  if not exists (
    select 1 from public.club_members
    where club_id = p_club_id and user_id = auth.uid()
  ) then
    return;
  end if;

  return query
    select * from public.club_members where club_id = p_club_id;
end;
$$;

grant execute on function public.get_club_members(uuid) to authenticated;
grant execute on function public.get_club_members(uuid) to anon;
