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
          gridTemplateColumns: "repeat(3, 1fr)",
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
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
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

function PlayerDashboard({
  players,
  game,
}: {
  players: PlayerPublic[];
  game: Game;
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
    return <VotingPlayerPanel game={game} players={players} />;
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
          gridTemplateColumns: "repeat(2, 1fr)",
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
        <div
          style={{
            marginTop: 20,
            background: "#1c2330",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: 20,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem" }}>
            {game.winner === "warga" ? "🎉" : "🐺"}
          </div>
          <h3
            style={{
              color: game.winner === "warga" ? "#3fb950" : "#f87171",
              fontWeight: 800,
              margin: "8px 0 4px",
            }}
          >
            {game.winner === "warga" ? "WARGA MENANG!" : "WEREWOLF MENANG!"}
          </h3>
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
    if (g) setGame(g as Game);
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
        <p style={{ color: "#8b949e" }}>Memuat game...</p>
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
        <PlayerDashboard players={players} game={game} />
      )}
      <style>{`@keyframes pop { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
