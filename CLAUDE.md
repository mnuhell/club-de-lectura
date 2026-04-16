# Bookclub App — CLAUDE.md

## Visión del producto

App de clubs de lectura con un ángulo social fuerte — lo que Goodreads nunca ejecutó bien.
No es solo trackear libros: es leer **juntos**, discutir capítulo a capítulo, y sentir que tu círculo lector importa.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Expo SDK 54 + Expo Router v6 (file-based routing) |
| UI | Tamagui 2.0-rc |
| Backend / DB | Supabase (auth + postgres + realtime + storage) |
| State / cache | TBD (considerar Zustand + React Query) |
| Navegación | expo-router (Stack + Tabs) |
| Lenguaje | TypeScript estricto |
| Gestor de paquetes | pnpm (con npm como fallback) |

---

## Arquitectura limpia

```
app/                    # Rutas (solo presentación, cero lógica)
├── (auth)/             # Login, registro, onboarding
├── (tabs)/             # Shell principal
│   ├── feed/           # Feed social
│   ├── clubs/          # Mis clubs
│   ├── library/        # Mi biblioteca personal
│   └── profile/        # Perfil
├── club/[id]/          # Detalle de un club
├── book/[id]/          # Detalle de un libro
└── modal.tsx

src/
├── domain/             # Entidades puras (Book, Club, Member, Post)
│   └── *.ts
├── usecases/           # Lógica de negocio (sin dependencias de UI ni infra)
│   └── *.ts
├── infrastructure/     # Implementaciones concretas
│   ├── supabase/       # Clientes y repos de Supabase
│   └── api/            # APIs externas (Open Library, Google Books)
├── repositories/       # Interfaces + implementaciones
│   └── *.ts
└── ui/
    ├── components/     # Componentes compartidos
    ├── hooks/          # Custom hooks (puente entre usecases y UI)
    └── theme/          # Tokens de diseño Tamagui
```

### Regla de dependencias
`app` → `ui/hooks` → `usecases` → `repositories (interfaces)` ← `infrastructure`

La UI nunca importa directamente de `infrastructure/`.

---

## Dominio principal

### Entidades
- **User** — perfil, avatar, libros leídos, stats sociales
- **Club** — nombre, descripción, libro actual, miembros, privacidad
- **Book** — metadata (ISBN, cover, autor), fuente externa
- **ReadingSession** — progreso de lectura de un club (capítulo/página actual)
- **Post** — comentario/reacción dentro de un club (puede tener spoiler tag)
- **Reaction** — emoji reaction a un post

### Features core
1. **Clubs** — crear, unirse, invitar por link/código
2. **Feed social** — actividad de mis clubs y amigos (qué leen, qué comentan)
3. **Reading progress** — capítulo actual del club, con spoiler-safe comments
4. **Biblioteca personal** — quiero leer / leyendo / leído
5. **Descubrimiento** — buscar libros (Open Library / Google Books API)

---

## Convenciones de código

- Componentes en PascalCase, hooks en `use*`
- No lógica de negocio en archivos de `app/` — solo composición de hooks y componentes
- Supabase client singleton en `src/infrastructure/supabase/client.ts`
- Variables de entorno con prefijo `EXPO_PUBLIC_` para las públicas
- Tipos de DB generados desde Supabase en `src/infrastructure/supabase/types.ts`

---

## Supabase

- Auth: email/password + magic link (futuro: OAuth Google/Apple)
- Row Level Security habilitado en todas las tablas
- Realtime para posts y progreso de lectura del club

---

## Notas de producto

- El diferenciador clave vs Goodreads: **lectura sincronizada** dentro del club + **discusión por capítulo** sin spoilers involuntarios
- Tono visual: cálido, literario, no frío/tech
- Mobile-first; web como bonus
