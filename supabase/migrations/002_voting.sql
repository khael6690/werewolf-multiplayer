-- Voting table for day-phase player voting
create table public.votes (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games(id) on delete cascade,
  round      int  not null,
  voter_id   uuid not null references public.players(id) on delete cascade,
  target_id  uuid not null references public.players(id) on delete cascade,
  created_at timestamptz default now(),
  unique(game_id, round, voter_id)
);

create index on public.votes (game_id, round);

alter table public.votes enable row level security;

create policy "votes_read_all"   on public.votes for select using (true);
create policy "votes_insert_all" on public.votes for insert with check (true);

alter publication supabase_realtime add table public.votes;

-- Add voting-related columns to games table
alter table public.games
  add column if not exists vote_candidates jsonb default '[]'::jsonb,
  add column if not exists vote_round int not null default 0;
