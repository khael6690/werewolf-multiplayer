import { createServerSupabase } from "../../../../lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkWin } from "../../../../lib/game-logic";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, gameId, payload } = await request.json();

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: game } = await admin
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  // Some actions don't require moderator auth (e.g. cast_vote by player)
  const isModerator = game && game.moderator_id === session.user.id;
  const isPlayerAction = action === "cast_vote";

  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (!isModerator && !isPlayerAction)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  switch (action) {
    case "start_night":
      await admin
        .from("games")
        .update({
          phase: "night",
          night_round: game.night_round + 1,
          night_step: "werewolf",
          night_actions: {},
        })
        .eq("id", gameId);
      break;
    case "night_step":
      await admin
        .from("games")
        .update({ night_step: payload.step, night_actions: payload.actions })
        .eq("id", gameId);
      break;
    case "ww_vote": {
      const { voterId, targetId } = payload;
      const { data: voter } = await admin.from("players").select("*").eq("id", voterId).single();
      if (!voter || voter.role !== "Werewolf" || voter.status !== "alive")
        return NextResponse.json({ error: "Invalid voter" }, { status: 400 });

      const currentActions = (game.night_actions as any) || {};
      const wwVotes = currentActions.wwVotes || {};
      wwVotes[voterId] = targetId;

      await admin
        .from("games")
        .update({ night_actions: { ...currentActions, wwVotes } })
        .eq("id", gameId);
      break;
    }
    case "ww_confirm_kill": {
      const { targetId } = payload;
      const currentActions = (game.night_actions as any) || {};
      await admin
        .from("games")
        .update({ night_actions: { ...currentActions, killId: targetId } })
        .eq("id", gameId);
      break;
    }
    case "process_night": {
      const { killId, healId } = payload;
      let killed = null;
      if (killId && killId !== healId) {
        await admin.from("players").update({ status: "dead" }).eq("id", killId);
        const { data: kp } = await admin
          .from("players")
          .select("*")
          .eq("id", killId)
          .single();
        killed = kp;
        await admin.from("game_events").insert({
          game_id: gameId,
          type: "night_kill",
          payload: { playerId: killId, name: kp?.name, role: kp?.role },
        });
      }
      if (killed?.role === "Hunter") {
        await admin
          .from("games")
          .update({ phase: "night", night_step: "hunter_revenge" })
          .eq("id", gameId);
        return NextResponse.json({ phase: "hunter_revenge", killed });
      }
      await admin
        .from("games")
        .update({ phase: "day", night_step: null })
        .eq("id", gameId);
      return NextResponse.json({ phase: "day", killed });
    }
    case "hunter_revenge": {
      if (payload.hunterKillId)
        await admin
          .from("players")
          .update({ status: "dead" })
          .eq("id", payload.hunterKillId);
      await admin
        .from("games")
        .update({ phase: "day", night_step: null })
        .eq("id", gameId);
      break;
    }
    // ── Moderator starts a vote by nominating 2 candidates ────
    case "start_voting": {
      const { candidateIds } = payload;
      if (!Array.isArray(candidateIds) || candidateIds.length !== 2)
        return NextResponse.json({ error: "Harus memilih tepat 2 kandidat" }, { status: 400 });
      const newRound = (game.vote_round ?? 0) + 1;
      await admin
        .from("games")
        .update({
          phase: "voting",
          vote_candidates: candidateIds,
          vote_round: newRound,
        })
        .eq("id", gameId);
      break;
    }
    // ── Player casts a vote for one of the 2 candidates ──────
    case "cast_vote": {
      const { voterId, targetId } = payload;
      if (!voterId || !targetId)
        return NextResponse.json({ error: "Missing voterId or targetId" }, { status: 400 });

      // Validate game is in voting phase
      if (game.phase !== "voting")
        return NextResponse.json({ error: "Bukan fase voting" }, { status: 400 });

      // Validate target is one of the candidates
      const candidates = game.vote_candidates ?? [];
      if (!candidates.includes(targetId))
        return NextResponse.json({ error: "Target bukan kandidat voting" }, { status: 400 });

      // Validate voter is alive
      const { data: voter } = await admin
        .from("players")
        .select("*")
        .eq("id", voterId)
        .single();
      if (!voter || voter.status !== "alive")
        return NextResponse.json({ error: "Pemain tidak valid atau sudah mati" }, { status: 400 });

      // Voter cannot be a candidate
      if (candidates.includes(voterId))
        return NextResponse.json({ error: "Kandidat tidak boleh memilih" }, { status: 400 });

      // Check if already voted this round
      const { data: existing } = await admin
        .from("votes")
        .select("id")
        .eq("game_id", gameId)
        .eq("round", game.vote_round)
        .eq("voter_id", voterId)
        .maybeSingle();
      if (existing)
        return NextResponse.json({ error: "Sudah voting di ronde ini" }, { status: 400 });

      await admin.from("votes").insert({
        game_id: gameId,
        round: game.vote_round,
        voter_id: voterId,
        target_id: targetId,
      });
      break;
    }
    // ── Moderator ends voting and executes the loser ─────────
    case "end_voting": {
      const round = game.vote_round;
      const candidateList: string[] = game.vote_candidates ?? [];
      if (candidateList.length !== 2)
        return NextResponse.json({ error: "Tidak ada kandidat voting" }, { status: 400 });

      // Count votes
      const { data: votes } = await admin
        .from("votes")
        .select("target_id")
        .eq("game_id", gameId)
        .eq("round", round);
      const tally: Record<string, number> = {};
      candidateList.forEach((id) => (tally[id] = 0));
      (votes ?? []).forEach((v: { target_id: string }) => {
        tally[v.target_id] = (tally[v.target_id] ?? 0) + 1;
      });

      // Determine who gets executed (most votes)
      // If tie, use payload.tiebreakerId chosen by moderator
      let executedId: string;
      if (tally[candidateList[0]] > tally[candidateList[1]]) {
        executedId = candidateList[0];
      } else if (tally[candidateList[1]] > tally[candidateList[0]]) {
        executedId = candidateList[1];
      } else {
        // Tie — moderator must pick
        if (payload.tiebreakerId && candidateList.includes(payload.tiebreakerId)) {
          executedId = payload.tiebreakerId;
        } else {
          return NextResponse.json({
            tie: true,
            tally,
            candidates: candidateList,
            message: "Voting seri! Moderator harus memilih.",
          });
        }
      }

      // Execute the player
      await admin.from("players").update({ status: "dead" }).eq("id", executedId);
      const { data: vp } = await admin
        .from("players")
        .select("*")
        .eq("id", executedId)
        .single();
      await admin.from("game_events").insert({
        game_id: gameId,
        type: "day_execute",
        payload: { playerId: executedId, name: vp?.name, role: vp?.role, byVoting: true, tally },
      });

      // Handle Hunter revenge
      if (vp?.role === "Hunter") {
        await admin
          .from("games")
          .update({ phase: "night", night_step: "hunter_revenge", vote_candidates: [] })
          .eq("id", gameId);
        return NextResponse.json({ phase: "hunter_revenge", executed: vp, tally });
      }

      // Check win condition
      const { data: allPlayers } = await admin
        .from("players")
        .select("*")
        .eq("game_id", gameId);
      const winner = checkWin(allPlayers ?? []);
      if (winner) {
        await admin
          .from("games")
          .update({ phase: "gameover", winner, vote_candidates: [] })
          .eq("id", gameId);
        await admin
          .from("game_events")
          .insert({ game_id: gameId, type: "game_over", payload: { winner } });
      } else {
        // Back to day phase
        await admin
          .from("games")
          .update({ phase: "day", vote_candidates: [] })
          .eq("id", gameId);
      }
      return NextResponse.json({ ok: true, executed: vp, tally });
    }
    case "execute_vote": {
      const { playerId } = payload;
      await admin.from("players").update({ status: "dead" }).eq("id", playerId);
      const { data: vp } = await admin
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();
      await admin.from("game_events").insert({
        game_id: gameId,
        type: "day_execute",
        payload: { playerId, name: vp?.name, role: vp?.role },
      });
      if (vp?.role === "Hunter") {
        await admin
          .from("games")
          .update({ phase: "night", night_step: "hunter_revenge" })
          .eq("id", gameId);
        return NextResponse.json({ phase: "hunter_revenge", executed: vp });
      }
      const { data: players } = await admin
        .from("players")
        .select("*")
        .eq("game_id", gameId);
      const winner = checkWin(players ?? []);
      if (winner) {
        await admin
          .from("games")
          .update({ phase: "gameover", winner })
          .eq("id", gameId);
        await admin
          .from("game_events")
          .insert({ game_id: gameId, type: "game_over", payload: { winner } });
      }
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
