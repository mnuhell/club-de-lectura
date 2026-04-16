-- Row Level Security

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.books enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.user_books enable row level security;

-- PROFILES
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- CLUBS
create policy "Public clubs are viewable by everyone"
  on public.clubs for select
  using (is_private = false or exists (
    select 1 from public.club_members
    where club_id = clubs.id and user_id = auth.uid()
  ));

create policy "Authenticated users can create clubs"
  on public.clubs for insert
  with check (auth.uid() = owner_id);

create policy "Owners and admins can update their club"
  on public.clubs for update
  using (exists (
    select 1 from public.club_members
    where club_id = clubs.id and user_id = auth.uid() and role in ('owner', 'admin')
  ));

create policy "Only owners can delete their club"
  on public.clubs for delete
  using (auth.uid() = owner_id);

-- CLUB MEMBERS
create policy "Members of a club can view its members"
  on public.club_members for select
  using (exists (
    select 1 from public.club_members cm
    where cm.club_id = club_members.club_id and cm.user_id = auth.uid()
  ) or exists (
    select 1 from public.clubs c
    where c.id = club_members.club_id and c.is_private = false
  ));

create policy "Users can join clubs"
  on public.club_members for insert
  with check (auth.uid() = user_id);

create policy "Owners and admins can manage members"
  on public.club_members for update
  using (exists (
    select 1 from public.club_members cm
    where cm.club_id = club_members.club_id and cm.user_id = auth.uid() and cm.role in ('owner', 'admin')
  ));

create policy "Users can leave clubs"
  on public.club_members for delete
  using (auth.uid() = user_id or exists (
    select 1 from public.club_members cm
    where cm.club_id = club_members.club_id and cm.user_id = auth.uid() and cm.role in ('owner', 'admin')
  ));

-- BOOKS (catálogo global, solo lectura para todos, insert autenticados)
create policy "Books are viewable by everyone"
  on public.books for select using (true);

create policy "Authenticated users can add books"
  on public.books for insert with check (auth.uid() is not null);

-- READING SESSIONS
create policy "Club members can view reading sessions"
  on public.reading_sessions for select
  using (exists (
    select 1 from public.club_members
    where club_id = reading_sessions.club_id and user_id = auth.uid()
  ));

create policy "Owners and admins can manage reading sessions"
  on public.reading_sessions for insert
  with check (exists (
    select 1 from public.club_members
    where club_id = reading_sessions.club_id and user_id = auth.uid() and role in ('owner', 'admin')
  ));

create policy "Owners and admins can update reading sessions"
  on public.reading_sessions for update
  using (exists (
    select 1 from public.club_members
    where club_id = reading_sessions.club_id and user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- POSTS
create policy "Club members can view posts"
  on public.posts for select
  using (exists (
    select 1 from public.club_members
    where club_id = posts.club_id and user_id = auth.uid()
  ));

create policy "Club members can create posts"
  on public.posts for insert
  with check (
    auth.uid() = author_id and
    exists (
      select 1 from public.club_members
      where club_id = posts.club_id and user_id = auth.uid()
    )
  );

create policy "Authors can update their posts"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "Authors and admins can delete posts"
  on public.posts for delete
  using (auth.uid() = author_id or exists (
    select 1 from public.club_members
    where club_id = posts.club_id and user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- REACTIONS
create policy "Club members can view reactions"
  on public.reactions for select
  using (exists (
    select 1 from public.posts p
    join public.club_members cm on cm.club_id = p.club_id
    where p.id = reactions.post_id and cm.user_id = auth.uid()
  ));

create policy "Club members can add reactions"
  on public.reactions for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.posts p
      join public.club_members cm on cm.club_id = p.club_id
      where p.id = reactions.post_id and cm.user_id = auth.uid()
    )
  );

create policy "Users can remove their own reactions"
  on public.reactions for delete
  using (auth.uid() = user_id);

-- USER BOOKS
create policy "Users can view their own library"
  on public.user_books for select
  using (auth.uid() = user_id);

create policy "Users can manage their own library"
  on public.user_books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own library"
  on public.user_books for update
  using (auth.uid() = user_id);

create policy "Users can delete from their own library"
  on public.user_books for delete
  using (auth.uid() = user_id);
