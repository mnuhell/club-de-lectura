-- Fix infinite recursion v2: remove self-referential subquery entirely.
-- Drop dependent policies first, then functions, then recreate everything cleanly.

-- 1. Drop all club_members policies that may reference old functions
drop policy if exists "Members of a club can view its members" on public.club_members;
drop policy if exists "Owners and admins can manage members" on public.club_members;
drop policy if exists "Users can leave clubs" on public.club_members;

-- 2. Now safe to drop the SECURITY DEFINER functions
drop function if exists public.is_club_member(uuid, uuid);
drop function if exists public.is_club_admin(uuid, uuid);

-- 3. Recreate policies with zero self-reference (no subquery on club_members itself)
create policy "Members of a club can view its members"
  on public.club_members for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.clubs c
      where c.id = club_members.club_id and c.is_private = false
    )
  );

create policy "Owners and admins can manage members"
  on public.club_members for update
  using (exists (
    select 1 from public.clubs c
    where c.id = club_members.club_id and c.owner_id = auth.uid()
  ));

create policy "Users can leave clubs"
  on public.club_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.clubs c
      where c.id = club_members.club_id and c.owner_id = auth.uid()
    )
  );
