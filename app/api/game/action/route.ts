import { createServerSupabase } from "../../../../lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkWin } from "../../../../lib/game-logic";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { action, gameId, payload } = await request.json();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isPlayerAction = ["cast_vote", "ww_vote", "ww_confirm_kill", "dokter_heal", "peramal_see", "hunter_shoot"].includes(action);

  if (!session && !isPlayerAction)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: game } = await admin
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  // Some actions don't require moderator auth
  const isModerator = session && game && game.moderator_id === session.user.id;
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
    case "dokter_heal": {
      // Dokter picks who to heal
      const { playerId, targetId } = payload;
      const { data: dokter } = await admin.from("players").select("*").eq("id", playerId).single();
      if (!dokter || dokter.role !== "Dokter" || dokter.status !== "alive")
        return NextResponse.json({ error: "Invalid dokter" }, { status: 400 });
      if (game.night_step !== "dokter")
        return NextResponse.json({ error: "Bukan giliran Dokter" }, { status: 400 });

      const currentActions = (game.night_actions as any) || {};
      await admin
        .from("games")
        .update({ night_actions: { ...currentActions, healId: targetId, dokterSubmitted: true } })
        .eq("id", gameId);
      break;
    }
    case "peramal_see": {
      // Peramal picks who to see
      const { playerId, targetId } = payload;
      const { data: peramal } = await admin.from("players").select("*").eq("id", playerId).single();
      if (!peramal || peramal.role !== "Peramal" || peramal.status !== "alive")
        return NextResponse.json({ error: "Invalid peramal" }, { status: 400 });
      if (game.night_step !== "peramal")
        return NextResponse.json({ error: "Bukan giliran Peramal" }, { status: 400 });

      // Look up the target's role
      const { data: target } = await admin.from("players").select("role").eq("id", targetId).single();
      if (!target)
        return NextResponse.json({ error: "Target tidak ditemukan" }, { status: 400 });

      const currentActions2 = (game.night_actions as any) || {};
      await admin
        .from("games")
        .update({
          night_actions: {
            ...currentActions2,
            seerTargetId: targetId,
            seerResult: target.role === "Werewolf" ? "werewolf" : "bukan",
            peramalSubmitted: true,
          },
        })
        .eq("id", gameId);

      return NextResponse.json({ ok: true, isWerewolf: target.role === "Werewolf" });
    }
    case "hunter_shoot": {
      // Hunter picks revenge target
      const { playerId, targetId } = payload;
      const { data: hunter } = await admin.from("players").select("*").eq("id", playerId).single();
      if (!hunter || hunter.role !== "Hunter")
        return NextResponse.json({ error: "Invalid hunter" }, { status: 400 });
      if (game.night_step !== "hunter_revenge")
        return NextResponse.json({ error: "Bukan giliran Hunter" }, { status: 400 });

      const currentActions3 = (game.night_actions as any) || {};
      await admin
        .from("games")
        .update({ night_actions: { ...currentActions3, hunterKillId: targetId, hunterSubmitted: true } })
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
    // ── Player casts a vote ────────────────────────────────────
    case "cast_vote": {
      const { voterId, targetId } = payload;
      if (!voterId || !targetId)
        return NextResponse.json({ error: "Missing voterId or targetId" }, { status: 400 });

      // Validate game is in voting phase
      if (game.phase !== "voting")
        return NextResponse.json({ error: "Bukan fase voting" }, { status: 400 });

      const candidates = game.vote_candidates ?? [];
      const isGlobalVoting = candidates.length === 1 && candidates[0] === "__global__";

      // Validate voter is alive
      const { data: voter } = await admin
        .from("players")
        .select("*")
        .eq("id", voterId)
        .single();
      if (!voter || voter.status !== "alive")
        return NextResponse.json({ error: "Pemain tidak valid atau sudah mati" }, { status: 400 });

      if (isGlobalVoting) {
        // Global voting: target must be an alive player (self-vote = skip)
        const { data: target } = await admin
          .from("players")
          .select("status")
          .eq("id", targetId)
          .single();
        if (!target || target.status !== "alive")
          return NextResponse.json({ error: "Target tidak valid" }, { status: 400 });
      } else {
        // VS voting: target must be one of the 2 candidates
        if (!candidates.includes(targetId))
          return NextResponse.json({ error: "Target bukan kandidat voting" }, { status: 400 });
        // Voter cannot be a candidate in VS mode
        if (candidates.includes(voterId))
          return NextResponse.json({ error: "Kandidat tidak boleh memilih" }, { status: 400 });
      }

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
    // ── Moderator starts a global vote (all alive players) ────
    case "start_voting_global": {
      const newRound = (game.vote_round ?? 0) + 1;
      await admin
        .from("games")
        .update({
          phase: "voting",
          vote_candidates: ["__global__"],
          vote_round: newRound,
        })
        .eq("id", gameId);
      break;
    }
    // ── Moderator ends global voting ─────────────────────────
    case "end_voting_global": {
      const gRound = game.vote_round;
      const gCandidates = game.vote_candidates ?? [];
      if (gCandidates.length !== 1 || gCandidates[0] !== "__global__")
        return NextResponse.json({ error: "Bukan mode voting global" }, { status: 400 });

      const { data: gAllPlayers } = await admin
        .from("players")
        .select("*")
        .eq("game_id", gameId);
      const gAlivePlayers = (gAllPlayers ?? []).filter((p: any) => p.status === "alive");
      const totalVoters = gAlivePlayers.length;

      const { data: gVotes } = await admin
        .from("votes")
        .select("voter_id,target_id")
        .eq("game_id", gameId)
        .eq("round", gRound);

      // Count votes, excluding self-votes (skip)
      const gTally: Record<string, number> = {};
      let skipCount = 0;
      (gVotes ?? []).forEach((v: { voter_id: string; target_id: string }) => {
        if (v.voter_id === v.target_id) {
          skipCount++;
        } else {
          gTally[v.target_id] = (gTally[v.target_id] ?? 0) + 1;
        }
      });

      // Find player with > 50% of total voters (strict majority)
      const threshold = Math.floor(totalVoters / 2) + 1;
      let gExecutedId: string | null = null;
      for (const [playerId, count] of Object.entries(gTally)) {
        if (count >= threshold) {
          gExecutedId = playerId;
          break;
        }
      }

      if (!gExecutedId) {
        // No elimination
        await admin
          .from("games")
          .update({ phase: "day", vote_candidates: [] })
          .eq("id", gameId);
        await admin.from("game_events").insert({
          game_id: gameId,
          type: "vote_no_elimination",
          payload: { tally: gTally, skipCount, threshold },
        });
        return NextResponse.json({ ok: true, noElimination: true, tally: gTally, skipCount, threshold });
      }

      // Execute the player
      await admin.from("players").update({ status: "dead" }).eq("id", gExecutedId);
      const { data: gVp } = await admin
        .from("players")
        .select("*")
        .eq("id", gExecutedId)
        .single();
      await admin.from("game_events").insert({
        game_id: gameId,
        type: "day_execute",
        payload: { playerId: gExecutedId, name: gVp?.name, role: gVp?.role, byGlobalVoting: true, tally: gTally, skipCount },
      });

      // Handle Hunter revenge
      if (gVp?.role === "Hunter") {
        await admin
          .from("games")
          .update({ phase: "night", night_step: "hunter_revenge", vote_candidates: [] })
          .eq("id", gameId);
        return NextResponse.json({ phase: "hunter_revenge", executed: gVp, tally: gTally });
      }

      // Check win condition
      const { data: gPlayersAfter } = await admin
        .from("players")
        .select("*")
        .eq("game_id", gameId);
      const gWinner = checkWin(gPlayersAfter ?? []);
      if (gWinner) {
        await admin
          .from("games")
          .update({ phase: "gameover", winner: gWinner, vote_candidates: [] })
          .eq("id", gameId);
        await admin
          .from("game_events")
          .insert({ game_id: gameId, type: "game_over", payload: { winner: gWinner } });
      } else {
        await admin
          .from("games")
          .update({ phase: "day", vote_candidates: [] })
          .eq("id", gameId);
      }
      return NextResponse.json({ ok: true, executed: gVp, tally: gTally, skipCount });
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
    // ── Moderator resets game (deletes all data) ─────────────
    case "reset_game": {
      // Cascade delete: players, cards, votes, game_events all removed automatically
      await admin.from("games").delete().eq("id", gameId);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
