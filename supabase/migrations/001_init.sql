create extension if not exists "pgcrypto";

create table public.games (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  moderator_id  uuid references auth.users(id),
  phase         text not null default 'setup',
  night_round   int  not null default 0,
  night_step    text default null,
  night_actions jsonb default '{}'::jsonb,
  winner        text default null,
  created_at    timestamptz default now()
);

create table public.cards (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references public.games(id) on delete cascade,
  slot      int  not null,
  role      text not null,
  player_id uuid,
  picked    bool not null default false,
  unique(game_id, slot)
);

create table public.players (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references public.games(id) on delete cascade,
  card_id   uuid references public.cards(id) on delete set null,
  name      text not null,
  role      text not null,
  status    text not null default 'alive',
  slot      int  not null,
  joined_at timestamptz default now()
);

alter table public.cards
  add constraint cards_player_fk
  foreign key (player_id) references public.players(id) on delete set null;

create table public.game_events (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games(id) on delete cascade,
  type       text not null,
  payload    jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index on public.cards   (game_id);
create index on public.players (game_id);
create index on public.game_events (game_id, created_at desc);

alter table public.games       enable row level security;
alter table public.cards       enable row level security;
alter table public.players     enable row level security;
alter table public.game_events enable row level security;

create policy "games_read_all"   on public.games for select using (true);
create policy "games_mod_insert" on public.games for insert with check (auth.uid() = moderator_id);
create policy "games_mod_update" on public.games for update using (auth.uid() = moderator_id);

create policy "cards_read_public" on public.cards for select using (true);
create policy "cards_mod_insert"  on public.cards for insert
  with check (auth.uid() = (select moderator_id from public.games where id = game_id));
create policy "cards_mod_update"  on public.cards for update
  using (auth.uid() = (select moderator_id from public.games where id = game_id));
create policy "cards_player_pick" on public.cards for update
  using (picked = false) with check (picked = true);

create policy "players_read_all"    on public.players for select using (true);
create policy "players_insert"      on public.players for insert with check (true);
create policy "players_mod_update"  on public.players for update
  using (auth.uid() = (select moderator_id from public.games where id = game_id));

create policy "events_read_all"   on public.game_events for select using (true);
create policy "events_insert_all" on public.game_events for insert with check (true);

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.game_events;

create or replace function generate_game_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text := '';
  i     int;
begin
  for i in 1..6 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$;
