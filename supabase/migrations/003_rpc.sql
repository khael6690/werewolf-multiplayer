create or replace function update_ww_vote(
  p_game_id uuid,
  p_voter_id text,
  p_target_id text
) returns void language plpgsql as $$
begin
  update public.games
  set night_actions = jsonb_set(
    coalesce(night_actions, '{}'::jsonb),
    '{wwVotes}',
    coalesce(night_actions->'wwVotes', '{}'::jsonb) || jsonb_build_object(p_voter_id, p_target_id)
  )
  where id = p_game_id;
end;
$$;
