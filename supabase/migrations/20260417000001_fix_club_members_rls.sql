-- Fix infinite recursion in club_members RLS policies.
-- The self-referential EXISTS subquery causes PostgreSQL to recurse infinitely.
-- Solution: SECURITY DEFINER functions bypass RLS, breaking the cycle.

create or replace function public.is_club_member(p_club_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club_id and user_id = p_user_id
  );
$$;

create or replace function public.is_club_admin(p_club_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club_id and user_id = p_user_id and role in ('owner', 'admin')
  );
$$;

-- Drop and recreate the three recursive club_members policies

drop policy if exists "Members of a club can view its members" on public.club_members;
create policy "Members of a club can view its members"
  on public.club_members for select
  using (
    public.is_club_member(club_members.club_id, auth.uid())
    or exists (
      select 1 from public.clubs c
      where c.id = club_members.club_id and c.is_private = false
    )
  );

drop policy if exists "Owners and admins can manage members" on public.club_members;
create policy "Owners and admins can manage members"
  on public.club_members for update
  using (public.is_club_admin(club_members.club_id, auth.uid()));

drop policy if exists "Users can leave clubs" on public.club_members;
create policy "Users can leave clubs"
  on public.club_members for delete
  using (
    auth.uid() = user_id
    or public.is_club_admin(club_members.club_id, auth.uid())
  );
