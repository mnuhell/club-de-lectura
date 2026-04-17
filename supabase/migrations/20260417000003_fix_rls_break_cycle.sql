-- Break the cross-table RLS cycle: club_members <-> clubs.
-- club_members policy referenced clubs, clubs policy referenced club_members → cycle.
-- Fix: club_members SELECT only checks user_id (zero cross-table refs).
-- clubs SELECT simplified: public clubs visible to all, private only to owner.
-- getMembers will use an RPC function to see other members (added below).

-- 1. club_members SELECT — no cross-table reference at all
drop policy if exists "Members of a club can view its members" on public.club_members;
create policy "Members of a club can view its members"
  on public.club_members for select
  using (auth.uid() = user_id);

-- 2. clubs SELECT — no longer references club_members (breaks the cycle)
drop policy if exists "Public clubs are viewable by everyone" on public.clubs;
create policy "Public clubs are viewable by everyone"
  on public.clubs for select
  using (
    is_private = false
    or owner_id = auth.uid()
  );

-- 3. RPC to get all members of a club (bypasses RLS safely with auth check inside)
create or replace function public.get_club_members(p_club_id uuid)
returns setof public.club_members
language sql
security definer
stable
set search_path = public
as $$
  select cm.* from public.club_members cm
  where cm.club_id = p_club_id
    and exists (
      select 1 from public.club_members me
      where me.club_id = p_club_id and me.user_id = auth.uid()
    );
$$;
