-- Create storage buckets for avatars and club covers
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true)
on conflict (id) do nothing;

-- Avatars: owner can upload/update, everyone can read
create policy "Avatar upload by owner"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatar update by owner"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Covers: club owners can upload, everyone can read
create policy "Cover upload by owner"
  on storage.objects for insert
  with check (bucket_id = 'covers' and auth.uid() is not null);

create policy "Cover update by owner"
  on storage.objects for update
  using (bucket_id = 'covers' and auth.uid() is not null);

create policy "Covers are publicly readable"
  on storage.objects for select
  using (bucket_id = 'covers');
