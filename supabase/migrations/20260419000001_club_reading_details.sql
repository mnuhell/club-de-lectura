ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS meeting_date timestamptz,
  ADD COLUMN IF NOT EXISTS bookstore_name text,
  ADD COLUMN IF NOT EXISTS bookstore_url text,
  ADD COLUMN IF NOT EXISTS bookstore_address text,
  ADD COLUMN IF NOT EXISTS bookstore_phone text;
