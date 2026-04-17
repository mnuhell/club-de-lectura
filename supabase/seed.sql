-- ============================================================
-- SEED DE DESARROLLO — datos de prueba para Folio
-- Usuarios de prueba: ana@bookclub.test / carlos@bookclub.test / sofia@bookclub.test
-- Contraseña para todos: Test1234!
-- Clubs públicos con invite codes: MAGICO01 / FANTSY01
-- ============================================================

-- 1. Usuarios de prueba
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  aud, role, raw_user_meta_data, created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    'ana@bookclub.test',
    crypt('Test1234!', gen_salt('bf')),
    now(), 'authenticated', 'authenticated',
    '{"username":"ana_libros","display_name":"Ana Libros"}',
    now() - interval '10 days', now()
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    'carlos@bookclub.test',
    crypt('Test1234!', gen_salt('bf')),
    now(), 'authenticated', 'authenticated',
    '{"username":"carlos_pages","display_name":"Carlos Páginas"}',
    now() - interval '8 days', now()
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    'sofia@bookclub.test',
    crypt('Test1234!', gen_salt('bf')),
    now(), 'authenticated', 'authenticated',
    '{"username":"sofia_reads","display_name":"Sofía Lectora"}',
    now() - interval '6 days', now()
  )
ON CONFLICT (id) DO NOTHING;

-- Enriquecer perfiles (el trigger ya los creó al insertar auth.users)
UPDATE public.profiles SET bio = 'Apasionada del realismo mágico y la literatura latinoamericana.'
  WHERE id = '00000000-0000-0000-0001-000000000001';
UPDATE public.profiles SET bio = 'Lector compulsivo de fantasía épica y ciencia ficción dura.'
  WHERE id = '00000000-0000-0000-0001-000000000002';
UPDATE public.profiles SET bio = 'Me pierdo en los libros y en las librerías de segunda mano.'
  WHERE id = '00000000-0000-0000-0001-000000000003';

-- 2. Libros
INSERT INTO public.books (id, title, author, isbn, description, page_count, published_year) VALUES
  (
    '00000000-0000-0000-0002-000000000001',
    'Cien años de soledad',
    'Gabriel García Márquez',
    '978-0-06-088328-7',
    'La saga de la familia Buendía a lo largo de siete generaciones en el pueblo mítico de Macondo.',
    432, 1967
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    'El nombre del viento',
    'Patrick Rothfuss',
    '978-0-7564-0407-9',
    'La historia de Kvothe, músico y mago legendario, narrada en sus propias palabras.',
    662, 2007
  ),
  (
    '00000000-0000-0000-0002-000000000003',
    'La sombra del viento',
    'Carlos Ruiz Zafón',
    '978-84-08-01638-9',
    'Un joven descubre un libro misterioso que lo arrastra a una Barcelona oscura de posguerra.',
    568, 2001
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Clubs
INSERT INTO public.clubs (id, name, description, owner_id, is_private, invite_code, current_book_id) VALUES
  (
    '00000000-0000-0000-0003-000000000001',
    'Realismo Mágico',
    'Exploramos la literatura latinoamericana: García Márquez, Borges, Cortázar. Todos bienvenidos.',
    '00000000-0000-0000-0001-000000000001',
    false, 'MAGICO01',
    '00000000-0000-0000-0002-000000000001'
  ),
  (
    '00000000-0000-0000-0003-000000000002',
    'Fantasía Épica',
    'Sanderson, Rothfuss, Martin. Nos perdemos en mundos de magia y dragones.',
    '00000000-0000-0000-0001-000000000002',
    false, 'FANTSY01',
    '00000000-0000-0000-0002-000000000002'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Membresías
INSERT INTO public.club_members (club_id, user_id, role) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000001', 'owner'),
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000002', 'member'),
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000003', 'member'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000002', 'owner'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000003', 'member')
ON CONFLICT DO NOTHING;

-- 5. Sesiones de lectura activas
INSERT INTO public.reading_sessions (id, club_id, book_id, current_chapter, current_page, started_at) VALUES
  (
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0002-000000000001',
    8, 94, now() - interval '5 days'
  ),
  (
    '00000000-0000-0000-0004-000000000002',
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0002-000000000002',
    12, 210, now() - interval '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Posts
INSERT INTO public.posts (id, club_id, author_id, reading_session_id, content, chapter_ref, has_spoiler, created_at, updated_at) VALUES
  (
    '00000000-0000-0000-0005-000000000001',
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0004-000000000001',
    'El capítulo 8 me dejó sin palabras. La escena del hielo y José Arcadio Buendía viendo el mundo como si todo fuera nuevo... es puro García Márquez. La maravilla como estado permanente.',
    8, false,
    now() - interval '2 days', now() - interval '2 days'
  ),
  (
    '00000000-0000-0000-0005-000000000002',
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0004-000000000001',
    'Lo que más me sorprende es cómo el tiempo funciona diferente en Macondo. No es lineal, es circular. Cada generación repite los mismos errores con distintos nombres.',
    8, false,
    now() - interval '1 day', now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0005-000000000003',
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0004-000000000001',
    'Hay algo que no esperaba al final de este capítulo... la revelación sobre Úrsula cambia todo lo anterior.',
    8, true,
    now() - interval '10 hours', now() - interval '10 hours'
  ),
  (
    '00000000-0000-0000-0005-000000000004',
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0004-000000000002',
    'Kvothe aprendiendo a tocar el laúd en la Universidad es uno de los pasajes más bonitos que he leído. La música como forma de magia narrativa.',
    12, false,
    now() - interval '5 hours', now() - interval '5 hours'
  ),
  (
    '00000000-0000-0000-0005-000000000005',
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0004-000000000002',
    'El sistema de magia Alar me parece brillante. Dividir la mente es una metáfora perfecta para la concentración total. Rothfuss construye magia que tiene lógica interna.',
    11, false,
    now() - interval '1 hour', now() - interval '1 hour'
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Reacciones
INSERT INTO public.reactions (id, post_id, user_id, emoji) VALUES
  ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000002', '❤️'),
  ('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000003', '❤️'),
  ('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000001', '🔥'),
  ('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0001-000000000001', '👏'),
  ('00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0001-000000000003', '🤔'),
  ('00000000-0000-0000-0006-000000000006', '00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0001-000000000003', '❤️'),
  ('00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0001-000000000002', '🔥'),
  ('00000000-0000-0000-0006-000000000008', '00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0001-000000000002', '🧠')
ON CONFLICT (id) DO NOTHING;
