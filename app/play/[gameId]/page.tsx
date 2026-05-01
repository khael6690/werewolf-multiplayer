"use client";
import { useEffect, useState, useCallback, use } from "react";
import { createClient } from "../../../lib/supabase/client";
import type { Game, CardPublic, PlayerPublic, Role } from "../../../lib/types";
import { ROLE_INFO } from "../../../lib/types";

function CardPickScreen({
  gameId,
  cards,
  onPick,
}: {
  gameId: string;
  cards: CardPublic[];
  onPick: () => void;
}) {
  const [selected, setSelected] = useState<CardPublic | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [revealed, setRevealed] = useState(false);

  async function handleConfirm() {
    if (!selected || !name.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/game/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, cardId: selected.id, name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }
    setMyRole(data.role);
    setRevealed(true);
    sessionStorage.setItem(`player_${gameId}`, data.playerId);
    setLoading(false);
    setTimeout(() => onPick(), 4000);
  }

  if (revealed && myRole) {
    const info = ROLE_INFO[myRole];
    return (
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: "4rem", animation: "pop 0.4s ease" }}>
          {info.emoji}
        </div>
        <p
          style={{
            color: "#8b949e",
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: 12,
          }}
        >
          Role kamu adalah
        </p>
        <h2
          style={{
            color: info.color,
            fontSize: "2rem",
            fontWeight: 800,
            margin: "8px 0",
          }}
        >
          {myRole}
        </h2>
        <p
          style={{
            color: "#c9d1d9",
            fontSize: "0.85rem",
            lineHeight: 1.6,
            maxWidth: 280,
            margin: "0 auto 24px",
          }}
        >
          {info.desc}
        </p>
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid #30363d",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#8b949e",
            fontSize: "0.82rem",
          }}
        >
          ⚠️ Ingat role ini! Jangan tunjukkan layar ini ke pemain lain.
          Dashboard akan terbuka otomatis...
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            background: "#1c2330",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: 20,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🃏</div>
          <p style={{ color: "#8b949e", fontSize: "0.85rem" }}>
            Kartu #{selected.slot} dipilih
          </p>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          placeholder="Nama kamu..."
          autoFocus
          style={{
            display: "block",
            width: "100%",
            padding: "12px 14px",
            background: "#0d1117",
            color: "#e6edf3",
            border: "1px solid #30363d",
            borderRadius: 8,
            fontSize: "1.1rem",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 12,
          }}
        />
        {error && (
          <p
            style={{
              color: "#f87171",
              fontSize: "0.8rem",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {error}
          </p>
        )}
        <button
          onClick={handleConfirm}
          disabled={loading || !name.trim()}
          style={{
            width: "100%",
            padding: 12,
            background: "linear-gradient(135deg,#1a7f37,#2ea043)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          {loading ? "Menyimpan..." : "👁️ Tampilkan Role"}
        </button>
        <button
          onClick={() => setSelected(null)}
          style={{
            width: "100%",
            padding: 10,
            background: "#21262d",
            color: "#e6edf3",
            border: "1px solid #30363d",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Batal
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <p
        style={{
          color: "#8b949e",
          fontSize: "0.82rem",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Pilih satu kartu — role tersembunyi di dalam
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
          gap: 10,
        }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            disabled={card.picked}
            onClick={() => setSelected(card)}
            style={{
              aspectRatio: "3/4",
              maxHeight: 120,
              borderRadius: 10,
              border: `2px solid ${card.picked ? "#3fb950" : "#30363d"}`,
              background: card.picked ? "#0f2a1a" : "#1c2330",
              color: card.picked ? "#3fb950" : "#8b949e",
              cursor: card.picked ? "default" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              fontWeight: 700,
              position: "relative",
            }}
          >
            <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>
              {card.slot}
            </span>
            {card.picked ? (
              <>
                <span
                  style={{
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {card.player_name ?? "Terisi"}
                </span>
                <span style={{ position: "absolute", top: 5, right: 7 }}>
                  ✅
                </span>
              </>
            ) : (
              <span
                style={{
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Kartu {card.slot}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Voting Player Panel ──────────────────────────────────────
function VotingPlayerPanel({
  game,
  players,
}: {
  game: Game;
  players: PlayerPublic[];
}) {
  const supabase = createClient();
  const myId =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`player_${game.id}`)
      : null;
  const candidates = (game.vote_candidates ?? []) as string[];
  const alivePlayers = players.filter((p) => p.status === "alive");
  const isCandidate = myId ? candidates.includes(myId) : false;
  const me = players.find((p) => p.id === myId);
  const isDead = me?.status === "dead";

  const [votes, setVotes] = useState<
    { voter_id: string; target_id: string }[]
  >([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  const loadVotes = useCallback(async () => {
    const { data } = await supabase
      .from("votes")
      .select("voter_id,target_id")
      .eq("game_id", game.id)
      .eq("round", game.vote_round);
    if (data) {
      setVotes(data);
      if (myId) {
        const myV = data.find((v: { voter_id: string }) => v.voter_id === myId);
        if (myV) setMyVote(myV.target_id);
      }
    }
  }, [game.id, game.vote_round, myId, supabase]);

  useEffect(() => {
    loadVotes();
    const ch = supabase
      .channel(`pvotes:${game.id}:${game.vote_round}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `game_id=eq.${game.id}`,
        },
        loadVotes
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [game.id, game.vote_round, loadVotes, supabase]);

  async function castVote(targetId: string) {
    if (!myId || myVote) return;
    setVoting(true);
    setError("");
    try {
      // Validate target is a candidate
      if (!candidates.includes(targetId)) {
        setError("Target bukan kandidat voting");
        setVoting(false);
        return;
      }
      // Insert vote directly via Supabase (RLS allows inserts)
      const { error: insertError } = await supabase.from("votes").insert({
        game_id: game.id,
        round: game.vote_round,
        voter_id: myId,
        target_id: targetId,
      });
      if (insertError) {
        if (insertError.code === "23505") {
          setError("Sudah voting di ronde ini");
        } else {
          setError(insertError.message || "Gagal voting");
        }
      } else {
        setMyVote(targetId);
      }
    } catch {
      setError("Gagal mengirim vote");
    }
    setVoting(false);
  }

  const tally: Record<string, number> = {};
  candidates.forEach((id) => (tally[id] = 0));
  votes.forEach((v) => {
    tally[v.target_id] = (tally[v.target_id] ?? 0) + 1;
  });

  const eligibleVoters = alivePlayers.filter(
    (p) => !candidates.includes(p.id)
  );
  const totalVotes = votes.length;
  const totalEligible = eligibleVoters.length;
  const maxVotes = Math.max(...Object.values(tally), 0);

  function getPlayerName(id: string) {
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      {/* Phase badge */}
      <div
        style={{
          background: "rgba(168,85,247,0.15)",
          border: "1px solid #5b21b6",
          borderRadius: 10,
          padding: "10px 16px",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: "1rem", color: "#c084fc" }}>
          🗳️ Fase Voting
        </span>
        <p
          style={{
            color: "#8b949e",
            fontSize: "0.78rem",
            margin: "4px 0 0",
          }}
        >
          {isCandidate
            ? "Kamu sedang dinominasikan! Menunggu hasil voting..."
            : isDead
              ? "Kamu sudah mati. Menonton voting..."
              : myVote
                ? "Kamu sudah voting! Menunggu pemain lain..."
                : "Pilih salah satu kandidat untuk dieksekusi!"}
        </p>
      </div>

      {/* Candidate cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {candidates.map((cId) => {
          const p = players.find((x) => x.id === cId);
          if (!p) return null;
          const voteCount = tally[cId] ?? 0;
          const pct =
            totalEligible > 0 ? (voteCount / totalEligible) * 100 : 0;
          const isLeading = voteCount === maxVotes && voteCount > 0;
          const isMyVoteTarget = myVote === cId;
          const canVote =
            !isCandidate && !isDead && !myVote && myId;
          return (
            <button
              key={cId}
              onClick={() => canVote && castVote(cId)}
              disabled={!canVote || voting}
              style={{
                flex: 1,
                minWidth: 130,
                background: isMyVoteTarget
                  ? "rgba(168,85,247,0.15)"
                  : isLeading
                    ? "rgba(239,68,68,0.08)"
                    : "#1c2330",
                border: `2px solid ${
                  isMyVoteTarget
                    ? "#a855f7"
                    : isLeading
                      ? "#ef4444"
                      : "#30363d"
                }`,
                borderRadius: 14,
                padding: 16,
                textAlign: "center",
                cursor: canVote ? "pointer" : "default",
                transition: "all 0.3s",
                boxShadow: isMyVoteTarget
                  ? "0 0 20px rgba(168,85,247,0.3)"
                  : "none",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>
                {p.id === myId ? "👤" : "❓"}
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "#e6edf3",
                  marginBottom: 6,
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 900,
                  color: isLeading ? "#f87171" : "#8b949e",
                }}
              >
                {voteCount}
              </div>
              <div
                style={{ fontSize: "0.7rem", color: "#8b949e", marginBottom: 6 }}
              >
                suara
              </div>
              <div
                style={{
                  height: 5,
                  background: "#21262d",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: isLeading
                      ? "linear-gradient(90deg,#ef4444,#f87171)"
                      : "linear-gradient(90deg,#6366f1,#818cf8)",
                    borderRadius: 3,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              {isMyVoteTarget && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.7rem",
                    color: "#a855f7",
                    fontWeight: 700,
                  }}
                >
                  ✦ Pilihanmu
                </div>
              )}
              {canVote && !voting && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.7rem",
                    color: "#58a6ff",
                    fontWeight: 600,
                  }}
                >
                  Tap untuk voting
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            background: "rgba(220,50,50,0.1)",
            border: "1px solid #5f1e1e",
            borderRadius: 8,
            padding: "8px 12px",
            color: "#f87171",
            fontSize: "0.82rem",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* Vote progress */}
      <div
        style={{
          background: "#1c2330",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{ fontSize: "0.78rem", color: "#8b949e", marginBottom: 6 }}
        >
          {totalVotes} / {totalEligible} pemain sudah voting
        </div>
        <div
          style={{
            height: 4,
            background: "#30363d",
            borderRadius: 2,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${
                totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0
              }%`,
              background:
                totalVotes === totalEligible
                  ? "#3fb950"
                  : "linear-gradient(90deg,#a855f7,#c084fc)",
              borderRadius: 2,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* Transparent vote list */}
      <p
        style={{
          color: "#8b949e",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        📋 Siapa Memilih Siapa
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 4,
          marginBottom: 16,
        }}
      >
        {eligibleVoters.map((p) => {
          const v = votes.find((x) => x.voter_id === p.id);
          const isMe = p.id === myId;
          return (
            <div
              key={p.id}
              style={{
                padding: "7px 10px",
                background: isMe
                  ? "rgba(240,192,64,0.08)"
                  : v
                    ? "rgba(168,85,247,0.06)"
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  isMe ? "#4a3a00" : v ? "#3b1c6b" : "#1c2330"
                }`,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.78rem",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: v ? "#a855f7" : "#30363d",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: isMe ? "#f0c040" : "#e6edf3",
                  fontWeight: isMe ? 700 : 600,
                  flex: 1,
                }}
              >
                {p.name}
                {isMe && (
                  <span style={{ fontSize: "0.65rem", marginLeft: 4 }}>
                    (kamu)
                  </span>
                )}
              </span>
              {v ? (
                <span
                  style={{
                    color: "#c084fc",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                  }}
                >
                  → {getPlayerName(v.target_id)}
                </span>
              ) : (
                <span
                  style={{
                    color: "#484f58",
                    fontSize: "0.7rem",
                    fontStyle: "italic",
                  }}
                >
                  Menunggu...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Voting Global Player Panel (Among Us style) ──────────────
function VotingGlobalPlayerPanel({
  game,
  players,
}: {
  game: Game;
  players: PlayerPublic[];
}) {
  const supabase = createClient();
  const myId =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`player_${game.id}`)
      : null;
  const alivePlayers = players.filter((p) => p.status === "alive");
  const me = players.find((p) => p.id === myId);
  const isDead = me?.status === "dead";

  const [votes, setVotes] = useState<
    { voter_id: string; target_id: string }[]
  >([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  const totalVoters = alivePlayers.length;
  const threshold = Math.floor(totalVoters / 2) + 1;

  const loadVotes = useCallback(async () => {
    const { data } = await supabase
      .from("votes")
      .select("voter_id,target_id")
      .eq("game_id", game.id)
      .eq("round", game.vote_round);
    if (data) {
      setVotes(data);
      if (myId) {
        const myV = data.find((v: { voter_id: string }) => v.voter_id === myId);
        if (myV) setMyVote(myV.target_id);
      }
    }
  }, [game.id, game.vote_round, myId, supabase]);

  useEffect(() => {
    loadVotes();
    const ch = supabase
      .channel(`gpvotes:${game.id}:${game.vote_round}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `game_id=eq.${game.id}`,
        },
        loadVotes
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [game.id, game.vote_round, loadVotes, supabase]);

  async function castVote(targetId: string) {
    if (!myId || myVote) return;
    setVoting(true);
    setError("");
    try {
      const { error: insertError } = await supabase.from("votes").insert({
        game_id: game.id,
        round: game.vote_round,
        voter_id: myId,
        target_id: targetId,
      });
      if (insertError) {
        if (insertError.code === "23505") {
          setError("Sudah voting di ronde ini");
        } else {
          setError(insertError.message || "Gagal voting");
        }
      } else {
        setMyVote(targetId);
      }
    } catch {
      setError("Gagal mengirim vote");
    }
    setVoting(false);
  }

  function handleSkip() {
    if (myId) castVote(myId); // Self-vote = skip
  }

  // Count votes, separating skips
  const tally: Record<string, number> = {};
  let skipCount = 0;
  alivePlayers.forEach((p) => (tally[p.id] = 0));
  votes.forEach((v) => {
    if (v.voter_id === v.target_id) {
      skipCount++;
    } else {
      tally[v.target_id] = (tally[v.target_id] ?? 0) + 1;
    }
  });

  const totalVoted = votes.length;
  const maxVotes = Math.max(...Object.values(tally), 0);
  const canVote = !isDead && !myVote && myId;
  const myVoteIsSkip = myVote && myVote === myId;

  // Sort players by vote count
  const votableTargets = alivePlayers
    .filter((p) => p.id !== myId)
    .sort((a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0));

  function getPlayerName(id: string) {
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      {/* Phase badge */}
      <div
        style={{
          background: "rgba(20,184,166,0.15)",
          border: "1px solid #0d9488",
          borderRadius: 10,
          padding: "10px 16px",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: "1rem", color: "#5eead4" }}>
          🌐 Voting Semua
        </span>
        <p
          style={{
            color: "#8b949e",
            fontSize: "0.78rem",
            margin: "4px 0 0",
          }}
        >
          {isDead
            ? "Kamu sudah mati. Menonton voting..."
            : myVoteIsSkip
              ? "Kamu memilih skip. Menunggu pemain lain..."
              : myVote
                ? `Kamu sudah voting! Menunggu pemain lain...`
                : "Pilih pemain untuk dieliminasi, atau skip!"}
        </p>
      </div>

      {/* Vote targets */}
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {votableTargets.map((p) => {
          const voteCount = tally[p.id] ?? 0;
          const pct = totalVoters > 0 ? (voteCount / totalVoters) * 100 : 0;
          const isLeading = voteCount === maxVotes && voteCount > 0;
          const meetsThreshold = voteCount >= threshold;
          const isMyVoteTarget = myVote === p.id;
          return (
            <button
              key={p.id}
              onClick={() => canVote && castVote(p.id)}
              disabled={!canVote || voting}
              style={{
                background: isMyVoteTarget
                  ? "rgba(20,184,166,0.15)"
                  : meetsThreshold
                    ? "rgba(239,68,68,0.08)"
                    : "#1c2330",
                border: `2px solid ${
                  isMyVoteTarget
                    ? "#14b8a6"
                    : meetsThreshold
                      ? "#ef4444"
                      : isLeading
                        ? "#0d9488"
                        : "#30363d"
                }`,
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: canVote ? "pointer" : "default",
                transition: "all 0.3s",
                boxShadow: isMyVoteTarget
                  ? "0 0 16px rgba(20,184,166,0.25)"
                  : "none",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "#e6edf3",
                  flex: 1,
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 900,
                    color: meetsThreshold
                      ? "#f87171"
                      : isLeading
                        ? "#5eead4"
                        : "#8b949e",
                    minWidth: 24,
                    textAlign: "center",
                  }}
                >
                  {voteCount}
                </div>
                <div
                  style={{
                    width: 50,
                    height: 5,
                    background: "#21262d",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: meetsThreshold
                        ? "linear-gradient(90deg,#ef4444,#f87171)"
                        : "linear-gradient(90deg,#0d9488,#14b8a6)",
                      borderRadius: 3,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
              {isMyVoteTarget && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#14b8a6",
                    fontWeight: 700,
                  }}
                >
                  ✦
                </span>
              )}
              {canVote && !voting && (
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "#58a6ff",
                    fontWeight: 600,
                  }}
                >
                  Tap
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Skip button */}
      {canVote && (
        <button
          onClick={handleSkip}
          disabled={voting}
          style={{
            width: "100%",
            padding: "10px 0",
            background: "#21262d",
            color: "#8b949e",
            border: "1px solid #30363d",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.88rem",
            marginBottom: 12,
            opacity: voting ? 0.5 : 1,
          }}
        >
          ⏭️ Skip Voting
        </button>
      )}

      {myVoteIsSkip && (
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid #30363d",
            borderRadius: 8,
            padding: "8px 14px",
            textAlign: "center",
            color: "#8b949e",
            fontSize: "0.82rem",
            marginBottom: 12,
          }}
        >
          ⏭️ Kamu memilih <strong>Skip</strong>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "rgba(220,50,50,0.1)",
            border: "1px solid #5f1e1e",
            borderRadius: 8,
            padding: "8px 12px",
            color: "#f87171",
            fontSize: "0.82rem",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* Vote progress */}
      <div
        style={{
          background: "#1c2330",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{ fontSize: "0.78rem", color: "#8b949e", marginBottom: 4 }}
        >
          {totalVoted} / {totalVoters} sudah voting • {skipCount} skip
        </div>
        <div style={{ fontSize: "0.68rem", color: "#5eead4", marginBottom: 6 }}>
          Butuh {threshold} suara untuk eliminasi
        </div>
        <div
          style={{
            height: 4,
            background: "#30363d",
            borderRadius: 2,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${
                totalVoters > 0 ? (totalVoted / totalVoters) * 100 : 0
              }%`,
              background:
                totalVoted === totalVoters
                  ? "#3fb950"
                  : "linear-gradient(90deg,#0d9488,#14b8a6)",
              borderRadius: 2,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* Transparent vote list */}
      <p
        style={{
          color: "#8b949e",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        📋 Status Pemilih
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 4,
          marginBottom: 16,
        }}
      >
        {alivePlayers.map((p) => {
          const v = votes.find((x) => x.voter_id === p.id);
          const isMe = p.id === myId;
          const isSkip = v && v.voter_id === v.target_id;
          return (
            <div
              key={p.id}
              style={{
                padding: "7px 10px",
                background: isMe
                  ? "rgba(240,192,64,0.08)"
                  : v
                    ? isSkip
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(20,184,166,0.06)"
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  isMe ? "#4a3a00" : v ? (isSkip ? "#30363d" : "#0d9488") : "#1c2330"
                }`,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.78rem",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: v ? (isSkip ? "#8b949e" : "#14b8a6") : "#30363d",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: isMe ? "#f0c040" : "#e6edf3",
                  fontWeight: isMe ? 700 : 600,
                  flex: 1,
                }}
              >
                {p.name}
                {isMe && (
                  <span style={{ fontSize: "0.65rem", marginLeft: 4 }}>
                    (kamu)
                  </span>
                )}
              </span>
              {v ? (
                isSkip ? (
                  <span
                    style={{
                      color: "#8b949e",
                      fontSize: "0.7rem",
                      fontStyle: "italic",
                    }}
                  >
                    Skip
                  </span>
                ) : (
                  <span
                    style={{
                      color: "#5eead4",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                    }}
                  >
                    → {getPlayerName(v.target_id)}
                  </span>
                )
              ) : (
                <span
                  style={{
                    color: "#484f58",
                    fontSize: "0.7rem",
                    fontStyle: "italic",
                  }}
                >
                  Menunggu...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Dokter Night UI Component ────────────────────────────────
function DokterNightUI({
  gameId,
  myId,
  players,
}: {
  gameId: string;
  myId: string;
  players: PlayerPublic[];
}) {
  const [selId, setSelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleHeal() {
    if (!selId) return;
    setLoading(true);
    await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "dokter_heal",
        gameId,
        payload: { playerId: myId, targetId: selId },
      }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
        <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <h3 style={{ color: "#58a6ff", margin: "0 0 10px" }}>💉 Pilihan Dikunci</h3>
          <p style={{ color: "#8b949e", fontSize: "0.85rem" }}>
            Kamu telah memilih pemain untuk diselamatkan. Menunggu fase selanjutnya...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "#58a6ff", margin: "0 0 10px" }}>💉 Pilih Pemain untuk Diselamatkan</h3>
        <p style={{ fontSize: "0.8rem", color: "#8b949e", marginBottom: 16 }}>
          Pilih satu pemain yang ingin kamu selamatkan malam ini. Jika Werewolf menyerang pemain ini, mereka akan selamat.
        </p>

        <div style={{ display: "grid", gap: 8 }}>
          {players.map(p => {
            const isSel = selId === p.id;
            const isMe = p.id === myId;
            return (
              <button
                key={p.id}
                onClick={() => setSelId(p.id)}
                style={{
                  background: isSel ? "rgba(88,166,255,0.15)" : "#0d1117",
                  border: `1px solid ${isSel ? "#58a6ff" : "#30363d"}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  boxShadow: isSel ? "0 0 12px rgba(88,166,255,0.2)" : "none",
                }}
              >
                <span style={{ color: isSel ? "#93c5fd" : "#e6edf3", fontWeight: "bold" }}>
                  {p.name} {isMe && <span style={{ fontSize: "0.7rem", color: "#58a6ff" }}>(kamu)</span>}
                </span>
                {isSel && (
                  <span style={{ fontSize: "0.75rem", color: "#58a6ff", fontWeight: 700 }}>
                    ✦ Dipilih
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selId && (
          <button
            onClick={handleHeal}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 16,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Mengirim..." : `💉 Selamatkan ${players.find(p => p.id === selId)?.name}`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Peramal Night UI Component ───────────────────────────────
function PeramalNightUI({
  gameId,
  myId,
  players,
}: {
  gameId: string;
  myId: string;
  players: PlayerPublic[];
}) {
  const [selId, setSelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ name: string; isWW: boolean } | null>(null);

  async function handleSee() {
    if (!selId) return;
    setLoading(true);
    const res = await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "peramal_see",
        gameId,
        payload: { playerId: myId, targetId: selId },
      }),
    });
    const data = await res.json();
    const targetName = players.find(p => p.id === selId)?.name ?? "???";
    setResult({ name: targetName, isWW: data.isWerewolf });
    setLoading(false);
  }

  if (result) {
    return (
      <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
        <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <h3 style={{ color: "#bc8cff", margin: "0 0 10px" }}>🔮 Hasil Ramalan</h3>
          <div style={{
            borderRadius: 10,
            padding: 14,
            fontWeight: 700,
            marginBottom: 10,
            background: result.isWW ? "rgba(220,50,50,0.2)" : "rgba(63,185,80,0.15)",
            border: `1px solid ${result.isWW ? "#dc2626" : "#3fb950"}`,
            color: result.isWW ? "#fca5a5" : "#86efac",
            fontSize: "1.1rem",
          }}>
            {result.isWW ? `🐺 YA, WEREWOLF! — ${result.name}` : `✅ BUKAN WEREWOLF — ${result.name}`}
          </div>
          <p style={{ color: "#8b949e", fontSize: "0.82rem" }}>
            ⚠️ Jangan tunjukkan layar ini! Menunggu moderator melanjutkan fase...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "#bc8cff", margin: "0 0 10px" }}>🔮 Pilih Pemain untuk Diintip</h3>
        <p style={{ fontSize: "0.8rem", color: "#8b949e", marginBottom: 16 }}>
          Pilih satu pemain untuk mengetahui apakah mereka Werewolf atau bukan.
        </p>

        <div style={{ display: "grid", gap: 8 }}>
          {players.map(p => {
            const isSel = selId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelId(p.id)}
                style={{
                  background: isSel ? "rgba(188,140,255,0.15)" : "#0d1117",
                  border: `1px solid ${isSel ? "#bc8cff" : "#30363d"}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  boxShadow: isSel ? "0 0 12px rgba(188,140,255,0.2)" : "none",
                }}
              >
                <span style={{ color: isSel ? "#d8b4fe" : "#e6edf3", fontWeight: "bold" }}>
                  {p.name}
                </span>
                {isSel && (
                  <span style={{ fontSize: "0.75rem", color: "#bc8cff", fontWeight: 700 }}>
                    ✦ Dipilih
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selId && (
          <button
            onClick={handleSee}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 16,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Mengintip..." : `🔮 Intip ${players.find(p => p.id === selId)?.name}`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Hunter Night UI Component ────────────────────────────────
function HunterNightUI({
  gameId,
  myId,
  players,
}: {
  gameId: string;
  myId: string;
  players: PlayerPublic[];
}) {
  const [selId, setSelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleShoot() {
    if (!selId) return;
    setLoading(true);
    await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "hunter_shoot",
        gameId,
        payload: { playerId: myId, targetId: selId },
      }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
        <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <h3 style={{ color: "#fcd34d", margin: "0 0 10px" }}>🏹 Target Dikunci</h3>
          <p style={{ color: "#8b949e", fontSize: "0.85rem" }}>
            Kamu telah memilih target balas dendam. Menunggu moderator mengeksekusi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "#fcd34d", margin: "0 0 10px" }}>🏹 Pembalasan Terakhir!</h3>
        <p style={{ fontSize: "0.8rem", color: "#8b949e", marginBottom: 16 }}>
          Kamu terbunuh! Tapi sebagai Hunter, kamu bisa membawa satu pemain bersamamu. Pilih target pembalasanmu!
        </p>

        <div style={{ display: "grid", gap: 8 }}>
          {players.map(p => {
            const isSel = selId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelId(p.id)}
                style={{
                  background: isSel ? "rgba(252,211,77,0.15)" : "#0d1117",
                  border: `1px solid ${isSel ? "#fcd34d" : "#30363d"}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  boxShadow: isSel ? "0 0 12px rgba(252,211,77,0.2)" : "none",
                }}
              >
                <span style={{ color: isSel ? "#fde68a" : "#e6edf3", fontWeight: "bold" }}>
                  {p.name}
                </span>
                {isSel && (
                  <span style={{ fontSize: "0.75rem", color: "#fcd34d", fontWeight: 700 }}>
                    ✦ Target
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selId && (
          <button
            onClick={handleShoot}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "linear-gradient(135deg,#b45309,#d97706)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 16,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Menembak..." : `🏹 Tembak ${players.find(p => p.id === selId)?.name}!`}
          </button>
        )}
      </div>
    </div>
  );
}

function PlayerDashboard({
  players,
  game,
  myRole,
  wwList,
}: {
  players: PlayerPublic[];
  game: Game;
  myRole: Role | null;
  wwList: string[];
}) {
  const alive = players.filter((p) => p.status === "alive").length;
  const dead = players.filter((p) => p.status === "dead").length;
  const myId =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`player_${game.id}`)
      : null;
  const phaseLabel: Record<string, string> = {
    distribution: "🃏 Distribusi Peran",
    night: "🌙 Fase Malam",
    day: "☀️ Fase Siang",
    voting: "🗳️ Fase Voting",
    gameover: "🏆 Game Over",
  };

  // If voting phase, render the voting UI instead
  if (game.phase === "voting") {
    const isGlobal = ((game.vote_candidates ?? []) as string[]).includes("__global__");
    if (isGlobal) {
      return <VotingGlobalPlayerPanel game={game} players={players} />;
    }
    return <VotingPlayerPanel game={game} players={players} />;
  }

  // Werewolf Night UI
  if (game.phase === "night" && game.night_step === "werewolf" && myRole === "Werewolf" && myId) {
    const isMeDead = players.find(p => p.id === myId)?.status === "dead";
    if (!isMeDead) {
      const wwVotes = (game.night_actions as any)?.wwVotes || {};
      const confirmedKill = game.night_actions?.killId;
      const aliveWWs = players.filter((p) => p.status === "alive" && wwList.includes(p.id));
      const aliveTargets = players.filter((p) => p.status === "alive" && !wwList.includes(p.id));

      const voteCounts: Record<string, number> = {};
      Object.values(wwVotes).forEach((targetId) => {
        voteCounts[targetId as string] = (voteCounts[targetId as string] || 0) + 1;
      });
      
      let consensusTarget: string | null = null;
      for (const [targetId, count] of Object.entries(voteCounts)) {
        if (count === aliveWWs.length && aliveWWs.length > 0) {
          consensusTarget = targetId;
          break;
        }
      }

      async function castWWVote(targetId: string) {
        if (confirmedKill) return;
        await fetch("/api/game/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ww_vote",
            gameId: game.id,
            payload: { voterId: myId, targetId },
          }),
        });
      }

      async function confirmKill() {
        if (!consensusTarget || confirmedKill) return;
        await fetch("/api/game/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ww_confirm_kill",
            gameId: game.id,
            payload: { targetId: consensusTarget },
          }),
        });
      }

      if (confirmedKill) {
        return (
          <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
            <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <h3 style={{ color: "#f87171", margin: "0 0 10px" }}>Pilihan Dikunci</h3>
              <p style={{ color: "#8b949e", fontSize: "0.85rem" }}>Target telah dikirim ke moderator. Menunggu fase selanjutnya...</p>
            </div>
          </div>
        );
      }

      return (
        <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
          <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: "#f87171", margin: "0 0 10px" }}>🐺 Pilih Korban</h3>
            <p style={{ fontSize: "0.8rem", color: "#8b949e", marginBottom: 16 }}>
              Semua Werewolf yang hidup harus memilih target yang sama agar bisa mengeksekusi.
            </p>

            <div style={{ display: "grid", gap: 8 }}>
              {aliveTargets.map(t => {
                const votesForThis = Object.entries(wwVotes).filter(([_, v]) => v === t.id).map(([k, _]) => k);
                const isMyVote = wwVotes[myId] === t.id;

                return (
                  <button
                    key={t.id}
                    onClick={() => castWWVote(t.id)}
                    style={{
                      background: isMyVote ? "rgba(248,113,113,0.15)" : "#0d1117",
                      border: `1px solid ${isMyVote ? "#ef4444" : "#30363d"}`,
                      borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <span style={{ color: isMyVote ? "#fca5a5" : "#e6edf3", fontWeight: "bold" }}>{t.name}</span>
                    <span style={{ fontSize: "0.75rem", color: isMyVote ? "#ef4444" : "#8b949e" }}>
                      {votesForThis.length} suara {votesForThis.length > 0 && `(${votesForThis.map(vid => players.find(p=>p.id===vid)?.name).join(", ")})`}
                    </span>
                  </button>
                )
              })}
            </div>

            {consensusTarget && (
              <button
                onClick={confirmKill}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  background: "linear-gradient(135deg,#b91c1c,#dc2626)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 16
                }}
              >
                🔪 Sepakat! Bunuh {players.find(p => p.id === consensusTarget)?.name}
              </button>
            )}
          </div>
        </div>
      );
    }
  }

  // ── Dokter Night UI ──────────────────────────────────────────
  if (game.phase === "night" && game.night_step === "dokter" && myRole === "Dokter" && myId) {
    const isMeDead = players.find(p => p.id === myId)?.status === "dead";
    if (!isMeDead) {
      const actions = game.night_actions as any;
      const alreadySubmitted = actions?.dokterSubmitted;
      const aliveTargets = players.filter(p => p.status === "alive");

      if (alreadySubmitted) {
        return (
          <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
            <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <h3 style={{ color: "#58a6ff", margin: "0 0 10px" }}>💉 Pilihan Dikunci</h3>
              <p style={{ color: "#8b949e", fontSize: "0.85rem" }}>
                Kamu telah memilih pemain untuk diselamatkan. Menunggu fase selanjutnya...
              </p>
            </div>
          </div>
        );
      }

      return <DokterNightUI gameId={game.id} myId={myId} players={aliveTargets} />;
    }
  }

  // ── Peramal Night UI ─────────────────────────────────────────
  if (game.phase === "night" && game.night_step === "peramal" && myRole === "Peramal" && myId) {
    const isMeDead = players.find(p => p.id === myId)?.status === "dead";
    if (!isMeDead) {
      const actions = game.night_actions as any;
      const alreadySubmitted = actions?.peramalSubmitted;

      if (alreadySubmitted) {
        const targetName = players.find(p => p.id === actions?.seerTargetId)?.name ?? "???";
        const isWW = actions?.seerResult === "werewolf";
        return (
          <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
            <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <h3 style={{ color: "#bc8cff", margin: "0 0 10px" }}>🔮 Hasil Ramalan</h3>
              <div style={{
                borderRadius: 10,
                padding: 14,
                fontWeight: 700,
                marginBottom: 10,
                background: isWW ? "rgba(220,50,50,0.2)" : "rgba(63,185,80,0.15)",
                border: `1px solid ${isWW ? "#dc2626" : "#3fb950"}`,
                color: isWW ? "#fca5a5" : "#86efac",
              }}>
                {isWW ? `🐺 YA, WEREWOLF! — ${targetName}` : `✅ BUKAN WEREWOLF — ${targetName}`}
              </div>
              <p style={{ color: "#8b949e", fontSize: "0.82rem" }}>
                Menunggu moderator melanjutkan fase...
              </p>
            </div>
          </div>
        );
      }

      const aliveTargets = players.filter(p => p.status === "alive" && p.id !== myId);
      return <PeramalNightUI gameId={game.id} myId={myId} players={aliveTargets} />;
    }
  }

  // ── Hunter Revenge UI ────────────────────────────────────────
  if (game.phase === "night" && game.night_step === "hunter_revenge" && myRole === "Hunter" && myId) {
    const actions = game.night_actions as any;
    const alreadySubmitted = actions?.hunterSubmitted;

    if (alreadySubmitted) {
      return (
        <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
          <div style={{ background: "#1c2330", border: "1px solid #30363d", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <h3 style={{ color: "#fcd34d", margin: "0 0 10px" }}>🏹 Target Dikunci</h3>
            <p style={{ color: "#8b949e", fontSize: "0.85rem" }}>
              Kamu telah memilih target balas dendam. Menunggu moderator mengeksekusi...
            </p>
          </div>
        </div>
      );
    }

    const aliveTargets = players.filter(p => p.status === "alive" && p.id !== myId);
    return <HunterNightUI gameId={game.id} myId={myId} players={aliveTargets} />;
  }

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      <div
        style={{
          background: "#1c2330",
          border: "1px solid #30363d",
          borderRadius: 10,
          padding: "10px 16px",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: "1rem", color: "#f0c040" }}>
          {phaseLabel[game.phase] ?? game.phase}
        </span>
        {game.phase === "night" && (
          <p
            style={{ color: "#8b949e", fontSize: "0.78rem", margin: "4px 0 0" }}
          >
            Moderator sedang memimpin fase malam...
          </p>
        )}
      </div>

      {game.phase === "day" && (
        <div style={{ background: "rgba(255,255,255,0.05)", borderLeft: "3px solid #f0c040", padding: "12px", borderRadius: "0 8px 8px 0", marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 8px", color: "#f0c040", fontSize: "0.85rem", textTransform: "uppercase" }}>📜 Kabar Semalam:</h4>
          {(() => {
            const actions = game.night_actions as any;
            const killId = actions?.killId;
            const healId = actions?.healId;
            const hunterKillId = actions?.hunterKillId;
            
            if (!actions || (!killId && !hunterKillId && game.night_round === 0)) {
               return <p style={{ margin: 0, fontSize: "0.85rem", color: "#8b949e" }}>Belum ada kabar.</p>;
            }

            return (
              <>
                {killId && killId === healId && (
                  <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "#86efac" }}>🐺💉 Semalam, Werewolf mencoba menyerang, tetapi Dokter berhasil menyelamatkan nyawanya!</p>
                )}
                {killId && killId !== healId && (
                  <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "#fca5a5" }}>🐺🩸 Semalam, <strong>{players.find(p => p.id === killId)?.name}</strong> tewas diserang Werewolf!</p>
                )}
                {!killId && game.night_round > 0 && (
                   <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "#e6edf3" }}>🌙 Malam berlalu dengan tenang. Tidak ada korban serangan Werewolf.</p>
                )}
                {hunterKillId && (
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#fcd34d" }}>🏹 Sebelum gugur, Hunter sempat membalas dendam dan membunuh <strong>{players.find(p => p.id === hunterKillId)?.name}</strong>!</p>
                )}
              </>
            );
          })()}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <span
          style={{
            flex: 1,
            padding: "6px 10px",
            background: "rgba(63,185,80,0.15)",
            border: "1px solid #3fb950",
            borderRadius: 20,
            color: "#3fb950",
            fontSize: "0.78rem",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          ✅ {alive} Hidup
        </span>
        <span
          style={{
            flex: 1,
            padding: "6px 10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid #30363d",
            borderRadius: 20,
            color: "#8b949e",
            fontSize: "0.78rem",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          💀 {dead} Mati
        </span>
      </div>
      <p
        style={{
          color: "#8b949e",
          fontSize: "0.78rem",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        Semua Pemain
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 8,
        }}
      >
        {players.map((p) => (
          <div
            key={p.id}
            style={{
              background:
                p.status === "dead"
                  ? "#1a0505"
                  : p.id === myId
                    ? "#2a2000"
                    : "#1c2330",
              border: `2px solid ${p.status === "dead" ? "#3d1515" : p.id === myId ? "#f0c040" : "#30363d"}`,
              borderRadius: 10,
              padding: "10px 8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.9rem",
                color: p.status === "dead" ? "#6b3333" : "#e6edf3",
                textDecoration: p.status === "dead" ? "line-through" : "none",
              }}
            >
              {p.name}
            </div>
            {p.id === myId && p.status === "alive" && (
              <div
                style={{ fontSize: "0.65rem", color: "#f0c040", marginTop: 3 }}
              >
                Kamu
              </div>
            )}
            {p.status === "dead" && (
              <div
                style={{ fontSize: "0.65rem", color: "#6b3333", marginTop: 3 }}
              >
                💀 Mati
              </div>
            )}
          </div>
        ))}
      </div>
      {game.phase === "gameover" && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: "#1c2330",
            border: "1px solid #30363d",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            maxWidth: 400,
            width: "100%",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            animation: "pop 0.3s ease",
          }}>
            <div style={{ fontSize: "4rem", marginBottom: 10 }}>
              {game.winner === "warga" ? "🎉" : "🐺"}
            </div>
            <h2
              style={{
                color: game.winner === "warga" ? "#3fb950" : "#f87171",
                fontWeight: 900,
                fontSize: "2rem",
                margin: "0 0 16px",
              }}
            >
              {game.winner === "warga" ? "WARGA MENANG!" : "WEREWOLF MENANG!"}
            </h2>
            <p style={{ color: "#8b949e", fontSize: "0.9rem" }}>
              Cek layar moderator untuk memulai game baru.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const supabase = createClient();
  const { gameId } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [cards, setCards] = useState<CardPublic[]>([]);
  const [players, setPlayers] = useState<PlayerPublic[]>([]);
  const [hasPicked, setHasPicked] = useState(false);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [wwList, setWwList] = useState<string[]>([]);
  const [gameDeleted, setGameDeleted] = useState(false);

  const loadData = useCallback(async () => {
    const [{ data: g }, { data: c }, { data: p }] = await Promise.all([
      supabase.from("games").select("*").eq("id", gameId).single(),
      supabase
        .from("cards")
        .select("id,slot,picked,player_id")
        .eq("game_id", gameId)
        .order("slot"),
      supabase
        .from("players")
        .select("id,name,status,slot")
        .eq("game_id", gameId)
        .order("slot"),
    ]);
    if (g) {
      setGame(g as Game);
    } else {
      // Game was deleted — moderator clicked 'Main Lagi'
      setGameDeleted(true);
      return;
    }
    if (p) setPlayers(p as PlayerPublic[]);
    if (c) {
      const pMap = Object.fromEntries(
        (p ?? []).map((pl: any) => [pl.id, pl.name]),
      );
      setCards(
        (c as any[]).map((card) => ({
          ...card,
          player_name: card.player_id ? pMap[card.player_id] : undefined,
        })),
      );
    }
    
    const myId = typeof window !== "undefined" ? sessionStorage.getItem(`player_${gameId}`) : null;
    if (myId) {
      const { data: myData } = await supabase.from("players").select("role").eq("id", myId).single();
      if (myData) {
        setMyRole(myData.role as Role);
        if (myData.role === "Werewolf") {
          const { data: wws } = await supabase.from("players").select("id").eq("game_id", gameId).eq("role", "Werewolf");
          if (wws) setWwList(wws.map((w: any) => w.id));
        }
      }
    }
  }, [gameId, supabase]);

  useEffect(() => {
    loadData();
    if (sessionStorage.getItem(`player_${gameId}`)) setHasPicked(true);
    const ch = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        loadData,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cards",
          filter: `game_id=eq.${gameId}`,
        },
        loadData,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        loadData,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [gameId, loadData, supabase]);

  // Redirect to home when game is deleted by moderator
  useEffect(() => {
    if (gameDeleted) {
      sessionStorage.removeItem(`player_${gameId}`);
      window.location.href = "/";
    }
  }, [gameDeleted, gameId]);

  if (!game)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0f14",
        }}
      >
        <p style={{ color: "#8b949e" }}>
          {gameDeleted ? "Game selesai! Mengalihkan..." : "Memuat game..."}
        </p>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0f14",
        color: "#e6edf3",
        fontFamily: '"Segoe UI", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg,#1a0a2e,#0d1117,#1a0a0a)",
          borderBottom: "1px solid #3d1f1f",
          padding: "14px 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#f0c040",
            fontWeight: 800,
            fontSize: "1.3rem",
            margin: 0,
            letterSpacing: 2,
          }}
        >
          🐺 WEREWOLF
        </h1>
        <p style={{ color: "#8b949e", fontSize: "0.75rem", margin: "3px 0 0" }}>
          Kode: <strong style={{ color: "#e6edf3" }}>{game.code}</strong>
        </p>
      </div>
      {game.phase === "distribution" && !hasPicked ? (
        <CardPickScreen
          gameId={gameId}
          cards={cards}
          onPick={() => setHasPicked(true)}
        />
      ) : (
        <PlayerDashboard players={players} game={game} myRole={myRole} wwList={wwList} />
      )}
      <style>{`@keyframes pop { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
