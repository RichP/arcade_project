-- Games table for Supabase Postgres
create table if not exists public.games (
  id text primary key,
  title text not null,
  featured boolean,
  genre text[],
  platforms text[],
  mobile boolean,
  height integer,
  width integer,
  rating double precision,
  released text,
  thumbnail text,
  description text,
  tags text[],
  url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_games_updated on public.games;
create trigger trg_games_updated
before update on public.games
for each row execute function public.set_updated_at();

-- Canonical Genre Mappings
create table if not exists public.genre_mappings (
  id text primary key,
  name text not null,
  includes text[] not null default '{}'::text[]
);
