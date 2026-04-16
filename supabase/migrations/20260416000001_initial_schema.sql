-- Enums
create type public.club_role as enum ('owner', 'admin', 'member');
create type public.book_status as enum ('want_to_read', 'reading', 'read');
create type public.external_source as enum ('openlibrary', 'google');

-- Profiles (extiende auth.users)
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null unique,
  display_name text,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Books (catálogo global, no por usuario)
create table public.books (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  author          text not null,
  isbn            text unique,
  cover_url       text,
  description     text,
  page_count      int,
  published_year  int,
  external_id     text,
  external_source public.external_source,
  created_at      timestamptz not null default now()
);

-- Clubs
create table public.clubs (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  cover_url       text,
  owner_id        uuid not null references public.profiles(id) on delete restrict,
  is_private      boolean not null default false,
  invite_code     text not null unique default substr(md5(random()::text), 1, 8),
  current_book_id uuid references public.books(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Club members
create table public.club_members (
  club_id   uuid not null references public.clubs(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      public.club_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

-- Reading sessions (historial de lecturas de un club)
create table public.reading_sessions (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references public.clubs(id) on delete cascade,
  book_id         uuid not null references public.books(id) on delete restrict,
  current_chapter int,
  current_page    int,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- Posts (discusiones dentro de un club)
create table public.posts (
  id                 uuid primary key default gen_random_uuid(),
  club_id            uuid not null references public.clubs(id) on delete cascade,
  author_id          uuid not null references public.profiles(id) on delete cascade,
  reading_session_id uuid references public.reading_sessions(id) on delete set null,
  content            text not null,
  has_spoiler        boolean not null default false,
  chapter_ref        int,
  page_ref           int,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Reactions
create table public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);

-- Biblioteca personal del usuario
create table public.user_books (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  book_id     uuid not null references public.books(id) on delete cascade,
  status      public.book_status not null,
  rating      smallint check (rating between 1 and 5),
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- Índices útiles
create index on public.club_members (user_id);
create index on public.posts (club_id, created_at desc);
create index on public.posts (author_id);
create index on public.reading_sessions (club_id);
create index on public.user_books (user_id, status);

-- updated_at automático
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger clubs_updated_at before update on public.clubs
  for each row execute function public.handle_updated_at();

create trigger posts_updated_at before update on public.posts
  for each row execute function public.handle_updated_at();

create trigger user_books_updated_at before update on public.user_books
  for each row execute function public.handle_updated_at();

-- Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
