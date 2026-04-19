ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS close_date timestamptz;
