"use client";
import { useEffect, useState, useCallback, use } from "react";
import { createClient } from "../../../lib/supabase/client";
import type { Game, Card, Player } from "../../../lib/types";
import { ROLE_INFO } from "../../../lib/types";

const NIGHT_STEPS = [
  "werewolf",
  "dokter",
  "peramal",
  "hunter_revenge",
] as const;

// ── Shared helpers ────────────────────────────────────────────
const S = {
  panel: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 12,
    padding: 20,
    maxWidth: 700,
    margin: "0 auto 16px",
  } as React.CSSProperties,
  btn: (color: string): React.CSSProperties => ({
    padding: "10px 0",
    width: "100%",
    background: color,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.95rem",
  }),
  narasi: (accent = "#58a6ff"): React.CSSProperties => ({
    background: "#1c2330",
    borderLeft: `3px solid ${accent}`,
    borderRadius: "0 8px 8px 0",
    padding: "12px 14px",
    fontSize: "0.88rem",
    color: "#c9d1d9",
    lineHeight: 1.6,
    marginBottom: 16,
  }),
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#8b949e",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    borderBottom: "1px solid #30363d",
    paddingBottom: 10,
    marginBottom: 14,
  },
};

// ── Status Bar ────────────────────────────────────────────────
function StatusBar({ players }: { players: Player[] }) {
  const alive = players.filter((p) => p.status === "alive").length;
  const wolves = players.filter(
    (p) => p.status === "alive" && p.role === "Werewolf"
  ).length;
  const dead = players.filter((p) => p.status === "dead").length;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <span
        style={{
          flex: 1,
          padding: "5px 10px",
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
          padding: "5px 10px",
          background: "rgba(220,50,50,0.15)",
          border: "1px solid #dc2626",
          borderRadius: 20,
          color: "#f87171",
          fontSize: "0.78rem",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        🐺 {wolves} WW
      </span>
      <span
        style={{
          flex: 1,
          padding: "5px 10px",
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
  );
}

// ── Player Grid ───────────────────────────────────────────────
function PlayerGrid({
  players,
  selectedId,
  onSelect,
  showRoles = false,
}: {
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showRoles?: boolean;
}) {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}
    >
      {players.map((p) => {
        const info = ROLE_INFO[p.role];
        const isDead = p.status === "dead";
        const isSel = selectedId === p.id;
        return (
          <button
            key={p.id}
            onClick={() => !isDead && onSelect(p.id)}
            disabled={isDead}
            style={{
              background: isDead ? "#1a0505" : isSel ? "#2a2000" : "#1c2330",
              border: `2px solid ${
                isDead ? "#3d1515" : isSel ? "#f0c040" : "#30363d"
              }`,
              borderRadius: 10,
              padding: "10px 6px",
              textAlign: "center",
              cursor: isDead ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: isSel ? "0 0 12px rgba(240,192,64,0.25)" : "none",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.88rem",
                color: isDead ? "#6b3333" : "#e6edf3",
                textDecoration: isDead ? "line-through" : "none",
              }}
            >
              {p.name}
            </div>
            {showRoles && (
              <div
                style={{
                  fontSize: "0.65rem",
                  marginTop: 3,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.08)",
                  color: info.color,
                }}
              >
                {info.emoji} {p.role}
              </div>
            )}
            {isSel && (
              <div
                style={{ fontSize: "0.65rem", color: "#f0c040", marginTop: 3 }}
              >
                ✦ Dipilih
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Setup Panel ───────────────────────────────────────────────
function SetupPanel({
  onGameCreated,
}: {
  onGameCreated: (gameId: string, code: string) => void;
}) {
  const [total, setTotal] = useState(12);
  const [roles, setRoles] = useState({
    Warga: 8,
    Werewolf: 2,
    Peramal: 1,
    Dokter: 1,
    Hunter: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/game/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total, roles }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }
    onGameCreated(data.gameId, data.code);
  }

  const roleList = [
    { key: "Warga", label: "Warga", emoji: "👤" },
    { key: "Werewolf", label: "Werewolf", emoji: "🐺" },
    { key: "Peramal", label: "Peramal", emoji: "🔮" },
    { key: "Dokter", label: "Dokter", emoji: "💉" },
    { key: "Hunter", label: "Hunter", emoji: "🏹" },
  ] as const;

  return (
    <div style={S.panel}>
      <div style={S.sectionTitle}>
        <span>⚙️</span> Setup Permainan
      </div>
      <label
        style={{
          color: "#8b949e",
          fontSize: "0.78rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Total Pemain
      </label>
      <input
        type="number"
        value={total}
        min={4}
        max={30}
        onChange={(e) => setTotal(+e.target.value)}
        style={{
          display: "block",
          width: "100%",
          margin: "6px 0 16px",
          padding: "8px 12px",
          background: "#0d1117",
          color: "#e6edf3",
          border: "1px solid #30363d",
          borderRadius: 8,
          fontSize: "1rem",
        }}
      />

      <div style={S.sectionTitle}>
        <span>🃏</span> Jumlah Peran
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {roleList.map((r) => (
          <div
            key={r.key}
            style={{
              background: "#1c2330",
              border: "1px solid #30363d",
              borderRadius: 10,
              padding: "10px 8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.8rem" }}>{r.emoji}</div>
            <div
              style={{
                fontSize: "0.65rem",
                color: "#8b949e",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                margin: "4px 0",
              }}
            >
              {r.label}
            </div>
            <input
              type="number"
              value={roles[r.key]}
              min={0}
              onChange={(e) =>
                setRoles((prev) => ({ ...prev, [r.key]: +e.target.value }))
              }
              style={{
                width: "100%",
                padding: "4px 6px",
                background: "#0d1117",
                color: "#e6edf3",
                border: "1px solid #30363d",
                borderRadius: 6,
                textAlign: "center",
                fontSize: "1rem",
                fontWeight: 700,
              }}
            />
          </div>
        ))}
      </div>
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.82rem", marginBottom: 10 }}>
          {error}
        </p>
      )}
      <button
        onClick={handleCreate}
        disabled={loading}
        style={S.btn("linear-gradient(135deg,#1f6feb,#388bfd)")}
      >
        {loading ? "Membuat..." : "🎲 Generate & Acak Kartu"}
      </button>
    </div>
  );
}

// ── Night Phase Panel ─────────────────────────────────────────
function NightPanel({
  game,
  players,
  gameId,
  onRefresh,
}: {
  game: Game;
  players: Player[];
  gameId: string;
  onRefresh: () => void;
}) {
  const [selId, setSelId] = useState<string | null>(null);
  const [seerResult, setSeerResult] = useState<{
    name: string;
    isWW: boolean;
  } | null>(null);
  const alivePlayers = players.filter((p) => p.status === "alive");

  const step = game.night_step;

  async function callAction(action: string, extra = {}) {
    await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, gameId, payload: extra }),
    });
    onRefresh();
  }

  function checkSeer(id: string) {
    const p = players.find((x) => x.id === id)!;
    setSeerResult({ name: p.name, isWW: p.role === "Werewolf" });
  }

  const STEP_CONFIG = {
    werewolf: {
      title: "🐺 Giliran Werewolf",
      accent: "#e05252",
      narasi:
        '"Semua warga, pejamkan mata... Werewolf, buka mata kalian." Werewolf sedang berdiskusi via perangkat mereka untuk memilih korban.',
      btnLabel: "Selesai, Lanjut ke Dokter ➔",
      nextAction: () => {
        callAction("night_step", {
          step: "dokter",
          actions: { ...game.night_actions, killId: selId || game.night_actions?.killId },
        });
        setSelId(null);
      },
      filter: (p: Player) => p.role !== "Werewolf",
    },
    dokter: {
      title: "💉 Giliran Dokter",
      accent: "#58a6ff",
      narasi:
        '"Werewolf, tutup mata. Dokter, buka mata." Dokter menunjuk siapa yang ingin diselamatkan malam ini.',
      btnLabel: "Selesai, Lanjut ke Peramal ➔",
      nextAction: () => {
        callAction("night_step", {
          step: "peramal",
          actions: { ...game.night_actions, healId: selId },
        });
        setSelId(null);
        setSeerResult(null);
      },
      filter: () => true,
    },
    peramal: {
      title: "🔮 Giliran Peramal",
      accent: "#bc8cff",
      narasi:
        '"Dokter, tutup mata. Peramal, buka mata." Peramal menunjuk satu pemain. Hasil hanya terlihat moderator.',
      btnLabel: "Semua Tidur, Proses Malam ➔",
      nextAction: () => {
        callAction("process_night", {
          killId: game.night_actions.killId,
          healId: game.night_actions.healId,
        });
      },
      filter: () => true,
    },
    hunter_revenge: {
      title: "🏹 Pembalasan Hunter",
      accent: "#fcd34d",
      narasi:
        'Hunter terbunuh! Bisikkan ke Hunter: "Kamu bisa membawa satu orang bersamamu." Hunter menunjuk targetnya.',
      btnLabel: "🏹 Eksekusi Peluru Hunter ➔",
      nextAction: () => {
        callAction("hunter_revenge", { hunterKillId: selId });
        setSelId(null);
      },
      filter: () => true,
    },
  } as const;

  if (!step || !(step in STEP_CONFIG)) return null;
  const cfg = STEP_CONFIG[step as keyof typeof STEP_CONFIG];

  return (
    <div
      style={{
        ...S.panel,
        background: "linear-gradient(135deg,#080d18,#0d1117)",
        border: "1px solid #1a2744",
      }}
    >
      <div
        style={{
          padding: "8px 16px",
          borderRadius: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(88,130,255,0.15)",
          border: "1px solid #1e3a5f",
          color: "#58a6ff",
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        🌙 Malam Ke-{game.night_round}
      </div>
      <h3
        style={{
          fontWeight: 800,
          fontSize: "1.1rem",
          margin: "0 0 12px",
          color: cfg.accent,
        }}
      >
        {cfg.title}
      </h3>
      <div style={S.narasi(cfg.accent)}>
        📢 <strong>Moderator:</strong> {cfg.narasi}
      </div>

      {seerResult && (
        <div
          style={{
            borderRadius: 10,
            padding: 14,
            textAlign: "center",
            fontWeight: 700,
            marginBottom: 16,
            background: seerResult.isWW
              ? "rgba(220,50,50,0.2)"
              : "rgba(63,185,80,0.15)",
            border: `1px solid ${seerResult.isWW ? "#dc2626" : "#3fb950"}`,
            color: seerResult.isWW ? "#fca5a5" : "#86efac",
          }}
        >
          {seerResult.isWW
            ? `🐺 YA, WEREWOLF! — ${seerResult.name}`
            : `✅ BUKAN WEREWOLF — ${seerResult.name}`}
        </div>
      )}

      {step === "werewolf" && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "rgba(224,82,82,0.1)", border: "1px solid #e05252", textAlign: "center" }}>
          <h4 style={{ margin: "0 0 8px", color: "#fca5a5" }}>Status Diskusi Werewolf:</h4>
          {game.night_actions?.killId ? (
            <p style={{ margin: 0, fontWeight: "bold", color: "#e05252" }}>
              ✅ Werewolf sepakat membunuh: {players.find(p => p.id === game.night_actions.killId)?.name}
            </p>
          ) : (
            <p style={{ margin: 0, color: "#8b949e", fontSize: "0.85rem" }}>
              ⏳ Menunggu para Werewolf mencapai mufakat...
            </p>
          )}
        </div>
      )}

      <PlayerGrid
        players={
          step === "werewolf" ? alivePlayers.filter(cfg.filter) : alivePlayers
        }
        selectedId={selId || (step === "werewolf" && !selId ? game.night_actions?.killId || null : null)}
        onSelect={step === "peramal" ? checkSeer : setSelId}
        showRoles
      />
      <button
        onClick={cfg.nextAction}
        style={{
          ...S.btn("linear-gradient(135deg,#1f6feb,#388bfd)"),
          marginTop: 16,
        }}
      >
        {cfg.btnLabel}
      </button>
    </div>
  );
}

// ── Day Phase Panel (with voting option) ─────────────────────
function DayPanel({
  game,
  players,
  gameId,
  onRefresh,
}: {
  game: Game;
  players: Player[];
  gameId: string;
  onRefresh: () => void;
}) {
  const [mode, setMode] = useState<"choose" | "direct" | "voting">("choose");
  const [selId, setSelId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const alivePlayers = players.filter((p) => p.status === "alive");

  function toggleCandidate(id: string) {
    setCandidates((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  async function doExecute() {
    if (!selId) return;
    await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "execute_vote",
        gameId,
        payload: { playerId: selId },
      }),
    });
    setSelId(null);
    setConfirm(false);
    onRefresh();
  }

  async function doStartVoting() {
    if (candidates.length !== 2) return;
    await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start_voting",
        gameId,
        payload: { candidateIds: candidates },
      }),
    });
    setCandidates([]);
    setMode("choose");
    onRefresh();
  }

  async function startNight() {
    await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start_night", gameId, payload: {} }),
    });
    onRefresh();
  }

  return (
    <div style={S.panel}>
      <div
        style={{
          padding: "8px 16px",
          borderRadius: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(240,192,64,0.12)",
          border: "1px solid #4a3a00",
          color: "#f0c040",
          fontWeight: 800,
          marginBottom: 12,
        }}
      >
        ☀️ Fase Siang
      </div>

      {mode === "choose" && (
        <>
          <div style={S.narasi("#f0c040")}>
            Semua pemain berdiskusi. Moderator memilih cara eksekusi:
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setMode("voting")}
              style={{
                ...S.btn("linear-gradient(135deg,#7c3aed,#a855f7)"),
                flex: 1,
              }}
            >
              🗳️ Mulai Voting
            </button>
            <button
              onClick={() => setMode("direct")}
              style={{
                ...S.btn("#21262d"),
                flex: 1,
                border: "1px solid #30363d",
              }}
            >
              ⚖️ Eksekusi Langsung
            </button>
          </div>
        </>
      )}

      {mode === "voting" && (
        <>
          <div style={S.sectionTitle}>
            <span>🗳️</span> Pilih 2 Kandidat Voting
          </div>
          <div style={S.narasi("#a855f7")}>
            Pilih <strong>2 pemain</strong> yang akan di-voting oleh seluruh pemain.
            Pemain dengan suara terbanyak akan dieksekusi.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: 8,
            }}
          >
            {alivePlayers.map((p) => {
              const info = ROLE_INFO[p.role];
              const isSel = candidates.includes(p.id);
              const canSelect = candidates.length < 2 || isSel;
              return (
                <button
                  key={p.id}
                  onClick={() => toggleCandidate(p.id)}
                  disabled={!canSelect && !isSel}
                  style={{
                    background: isSel
                      ? "linear-gradient(135deg,#2d1b69,#1a0a3e)"
                      : "#1c2330",
                    border: `2px solid ${isSel ? "#a855f7" : "#30363d"}`,
                    borderRadius: 10,
                    padding: "10px 6px",
                    textAlign: "center",
                    cursor: canSelect ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    boxShadow: isSel
                      ? "0 0 16px rgba(168,85,247,0.3)"
                      : "none",
                    opacity: !canSelect && !isSel ? 0.4 : 1,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      color: isSel ? "#d8b4fe" : "#e6edf3",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      marginTop: 3,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.08)",
                      color: info.color,
                    }}
                  >
                    {info.emoji} {p.role}
                  </div>
                  {isSel && (
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "#a855f7",
                        marginTop: 3,
                        fontWeight: 700,
                      }}
                    >
                      ✦ Kandidat {candidates.indexOf(p.id) + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {candidates.length === 2 && (
            <button
              onClick={doStartVoting}
              style={{
                ...S.btn("linear-gradient(135deg,#7c3aed,#a855f7)"),
                marginTop: 16,
              }}
            >
              🗳️ Mulai Voting —{" "}
              {candidates
                .map((id) => players.find((p) => p.id === id)?.name)
                .join(" vs ")}
            </button>
          )}
          <button
            onClick={() => {
              setMode("choose");
              setCandidates([]);
            }}
            style={{
              ...S.btn("#21262d"),
              border: "1px solid #30363d",
              marginTop: 8,
            }}
          >
            ← Kembali
          </button>
        </>
      )}

      {mode === "direct" && (
        <>
          <div style={S.sectionTitle}>
            <span>⚖️</span> Eksekusi Langsung
          </div>
          <div style={S.narasi("#f0c040")}>
            Klik nama yang <strong>disepakati forum</strong> untuk dieksekusi.
          </div>
          <PlayerGrid
            players={players}
            selectedId={selId}
            onSelect={setSelId}
            showRoles
          />
          {selId && !confirm && (
            <button
              onClick={() => setConfirm(true)}
              style={{
                ...S.btn("linear-gradient(135deg,#b91c1c,#dc2626)"),
                marginTop: 16,
              }}
            >
              ⚖️ Eksekusi {players.find((p) => p.id === selId)?.name}
            </button>
          )}
          {confirm && (
            <div
              style={{
                marginTop: 16,
                background: "rgba(220,50,50,0.1)",
                border: "1px solid #5f1e1e",
                borderRadius: 10,
                padding: 16,
                textAlign: "center",
              }}
            >
              <p
                style={{ color: "#f87171", fontWeight: 700, margin: "0 0 12px" }}
              >
                Yakin eksekusi{" "}
                <strong>{players.find((p) => p.id === selId)?.name}</strong>?
                Tidak bisa dibatalkan.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setConfirm(false)}
                  style={{ ...S.btn("#21262d"), border: "1px solid #30363d" }}
                >
                  Batal
                </button>
                <button
                  onClick={doExecute}
                  style={S.btn("linear-gradient(135deg,#b91c1c,#dc2626)")}
                >
                  ⚖️ Eksekusi!
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setMode("choose");
              setSelId(null);
              setConfirm(false);
            }}
            style={{
              ...S.btn("#21262d"),
              border: "1px solid #30363d",
              marginTop: 8,
            }}
          >
            ← Kembali
          </button>
        </>
      )}

      <button
        onClick={startNight}
        style={{
          ...S.btn("#21262d"),
          border: "1px solid #30363d",
          marginTop: 12,
        }}
      >
        🌙 Akhiri Siang → Mulai Malam
      </button>
    </div>
  );
}

// ── Voting Moderator Panel ───────────────────────────────────
function VotingModeratorPanel({
  game,
  players,
  gameId,
  onRefresh,
}: {
  game: Game;
  players: Player[];
  gameId: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [votes, setVotes] = useState<
    { voter_id: string; target_id: string }[]
  >([]);
  const [tiebreaker, setTiebreaker] = useState<string | null>(null);
  const [tieResult, setTieResult] = useState<{
    tie: boolean;
    tally: Record<string, number>;
    candidates: string[];
  } | null>(null);

  const candidates = (game.vote_candidates ?? []) as string[];
  const alivePlayers = players.filter((p) => p.status === "alive");
  const eligibleVoters = alivePlayers.filter(
    (p) => !candidates.includes(p.id)
  );

  const loadVotes = useCallback(async () => {
    const { data } = await supabase
      .from("votes")
      .select("voter_id,target_id")
      .eq("game_id", gameId)
      .eq("round", game.vote_round);
    if (data) setVotes(data);
  }, [gameId, game.vote_round, supabase]);

  useEffect(() => {
    loadVotes();
    const ch = supabase
      .channel(`votes:${gameId}:${game.vote_round}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `game_id=eq.${gameId}`,
        },
        loadVotes
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [gameId, game.vote_round, loadVotes, supabase]);

  const tally: Record<string, number> = {};
  candidates.forEach((id) => (tally[id] = 0));
  votes.forEach((v) => {
    tally[v.target_id] = (tally[v.target_id] ?? 0) + 1;
  });

  const totalVotes = votes.length;
  const totalEligible = eligibleVoters.length;
  const maxVotes = Math.max(...Object.values(tally), 0);

  async function handleEndVoting() {
    const res = await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end_voting",
        gameId,
        payload: tiebreaker ? { tiebreakerId: tiebreaker } : {},
      }),
    });
    const data = await res.json();
    if (data.tie) {
      setTieResult(data);
    } else {
      setTieResult(null);
      onRefresh();
    }
  }

  async function handleCancelVoting() {
    // Return to day phase
    const admin = createClient();
    await admin
      .from("games")
      .update({ phase: "day", vote_candidates: [] })
      .eq("id", gameId);
    onRefresh();
  }

  function getPlayerName(id: string) {
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  return (
    <div
      style={{
        ...S.panel,
        background: "linear-gradient(135deg,#1a0a3e,#0d1117)",
        border: "1px solid #3d1f5f",
      }}
    >
      <div
        style={{
          padding: "8px 16px",
          borderRadius: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(168,85,247,0.15)",
          border: "1px solid #5b21b6",
          color: "#c084fc",
          fontWeight: 800,
          marginBottom: 12,
        }}
      >
        🗳️ Fase Voting
      </div>

      <div style={S.sectionTitle}>
        <span>⚔️</span> Kandidat
      </div>

      {/* Candidate cards with vote bars */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        {candidates.map((cId) => {
          const p = players.find((x) => x.id === cId);
          if (!p) return null;
          const info = ROLE_INFO[p.role];
          const voteCount = tally[cId] ?? 0;
          const pct = totalEligible > 0 ? (voteCount / totalEligible) * 100 : 0;
          const isLeading = voteCount === maxVotes && voteCount > 0;
          return (
            <div
              key={cId}
              style={{
                flex: 1,
                minWidth: 140,
                background: isLeading
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: `2px solid ${isLeading ? "#ef4444" : "#30363d"}`,
                borderRadius: 14,
                padding: 16,
                textAlign: "center",
                transition: "all 0.3s",
              }}
            >
              <div
                style={{
                  fontSize: "1.8rem",
                  marginBottom: 4,
                }}
              >
                {info.emoji}
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "1rem",
                  color: "#e6edf3",
                  marginBottom: 2,
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: info.color,
                  marginBottom: 10,
                }}
              >
                {p.role}
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: isLeading ? "#f87171" : "#8b949e",
                }}
              >
                {voteCount}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#8b949e",
                  marginBottom: 6,
                }}
              >
                suara
              </div>
              <div
                style={{
                  height: 6,
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
            </div>
          );
        })}
      </div>

      {/* Voter progress */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.78rem",
            color: "#8b949e",
            marginBottom: 6,
          }}
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
              width: `${totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0}%`,
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

      {/* Vote details */}
      <div style={S.sectionTitle}>
        <span>📋</span> Detail Suara
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {eligibleVoters.map((p) => {
          const v = votes.find((x) => x.voter_id === p.id);
          return (
            <div
              key={p.id}
              style={{
                padding: "8px 10px",
                background: v ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${v ? "#5b21b6" : "#21262d"}`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.78rem",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: v ? "#a855f7" : "#30363d",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "#e6edf3",
                  fontWeight: 600,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.name}
              </span>
              {v ? (
                <span
                  style={{
                    color: "#c084fc",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                  }}
                >
                  → {getPlayerName(v.target_id)}
                </span>
              ) : (
                <span style={{ color: "#484f58", fontSize: "0.7rem" }}>
                  Belum
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tie result */}
      {tieResult && (
        <div
          style={{
            background: "rgba(234,179,8,0.1)",
            border: "1px solid #854d0e",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>⚖️</div>
          <p
            style={{
              color: "#fbbf24",
              fontWeight: 700,
              fontSize: "0.9rem",
              margin: "0 0 12px",
            }}
          >
            Voting Seri! Pilih siapa yang dieksekusi:
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {tieResult.candidates.map((cId) => (
              <button
                key={cId}
                onClick={() => setTiebreaker(cId)}
                style={{
                  padding: "10px 18px",
                  background:
                    tiebreaker === cId
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(255,255,255,0.05)",
                  border: `2px solid ${tiebreaker === cId ? "#ef4444" : "#30363d"}`,
                  borderRadius: 8,
                  color: tiebreaker === cId ? "#fca5a5" : "#e6edf3",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.88rem",
                }}
              >
                {getPlayerName(cId)} ({tieResult.tally[cId]} suara)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleEndVoting}
          disabled={totalVotes === 0}
          style={{
            ...S.btn(
              totalVotes === totalEligible
                ? "linear-gradient(135deg,#b91c1c,#dc2626)"
                : "linear-gradient(135deg,#7c3aed,#a855f7)"
            ),
            flex: 2,
            opacity: totalVotes === 0 ? 0.5 : 1,
          }}
        >
          {totalVotes === totalEligible
            ? "⚖️ Akhiri Voting & Eksekusi"
            : `⚖️ Akhiri Voting (${totalVotes}/${totalEligible})`}
        </button>
        <button
          onClick={handleCancelVoting}
          style={{
            ...S.btn("#21262d"),
            flex: 1,
            border: "1px solid #30363d",
          }}
        >
          ✕ Batal
        </button>
      </div>
    </div>
  );
}

// ── Distribution Panel ────────────────────────────────────────
function DistributionPanel({
  cards,
  players,
  gameId,
  onRefresh,
}: {
  cards: Card[];
  players: Player[];
  gameId: string;
  onRefresh: () => void;
}) {
  const picked = cards.filter((c) => c.picked).length;
  const total = cards.length;

  async function startGame() {
    await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start_night", gameId, payload: {} }),
    });
    onRefresh();
  }

  return (
    <div style={S.panel}>
      <div style={S.sectionTitle}>
        <span>🃏</span> Distribusi Peran
      </div>
      <div style={S.narasi()}>
        Pemain membuka <strong>/play/{gameId}</strong> di HP masing-masing dan
        memilih kartu. Kartu yang sudah dipilih terkunci otomatis secara
        realtime.
      </div>
      <div
        style={{
          background: "#1c2330",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 16,
          textAlign: "center",
          color: "#8b949e",
          fontSize: "0.82rem",
        }}
      >
        {picked} / {total} pemain terdaftar
        <div
          style={{
            height: 4,
            background: "#30363d",
            borderRadius: 2,
            marginTop: 8,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${total ? (picked / total) * 100 : 0}%`,
              background: "#3fb950",
              borderRadius: 2,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>
      {/* Show role list for moderator */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {cards.map((card) => {
          const p = players.find((pl) => pl.card_id === card.id);
          const info = ROLE_INFO[card.role];
          return (
            <div
              key={card.id}
              style={{
                background: card.picked ? "#0f2a1a" : "#1c2330",
                border: `2px solid ${card.picked ? "#3fb950" : "#30363d"}`,
                borderRadius: 10,
                padding: "10px 6px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: card.picked ? "#3fb950" : "#8b949e",
                }}
              >
                #{card.slot}
              </div>
              {card.picked && p ? (
                <>
                  <div
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "#e6edf3",
                      margin: "4px 0 2px",
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: info.color }}>
                    {info.emoji} {card.role}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "1.4rem" }}>{info.emoji}</div>
              )}
            </div>
          );
        })}
      </div>
      {picked === total && total > 0 && (
        <button
          onClick={startGame}
          style={S.btn("linear-gradient(135deg,#1a7f37,#2ea043)")}
        >
          ✅ Semua Siap — Mulai Malam Pertama
        </button>
      )}
    </div>
  );
}

// ── Main Moderator Page ───────────────────────────────────────
export default function ModeratorPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const supabase = createClient();
  const { gameId } = use(params);

  const [game, setGame] = useState<Game | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isSetup, setIsSetup] = useState(!gameId || gameId === "new");

  const loadData = useCallback(async () => {
    if (!gameId || gameId === "new") return;
    const [{ data: g }, { data: c }, { data: p }] = await Promise.all([
      supabase.from("games").select("*").eq("id", gameId).single(),
      supabase.from("cards").select("*").eq("game_id", gameId).order("slot"),
      supabase.from("players").select("*").eq("game_id", gameId).order("slot"),
    ]);
    if (g) setGame(g as Game);
    if (c) setCards(c as Card[]);
    if (p) setPlayers(p as Player[]);
  }, [gameId, supabase]);

  useEffect(() => {
    loadData();
    if (gameId === "new") return;
    const ch = supabase
      .channel(`mod:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        loadData
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cards",
          filter: `game_id=eq.${gameId}`,
        },
        loadData
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        loadData
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [gameId, loadData, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (gameId === "new" || isSetup) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d0f14",
          color: "#e6edf3",
          fontFamily: '"Segoe UI", system-ui, sans-serif',
          padding: "0 0 40px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#1a0a2e,#0d1117)",
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
            }}
          >
            🐺 WEREWOLF — Moderator
          </h1>
        </div>
        <div style={{ padding: "16px 12px" }}>
          <SetupPanel
            onGameCreated={(gId) => {
              window.location.href = `/moderator/${gId}`;
            }}
          />
        </div>
      </div>
    );
  }

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
        <p style={{ color: "#8b949e" }}>Memuat...</p>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0f14",
        color: "#e6edf3",
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        padding: "0 0 40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#1a0a2e,#0d1117)",
          borderBottom: "1px solid #3d1f1f",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              color: "#f0c040",
              fontWeight: 800,
              fontSize: "1.1rem",
              margin: 0,
            }}
          >
            🐺 WEREWOLF — Mod
          </h1>
          <p
            style={{ color: "#8b949e", fontSize: "0.72rem", margin: "2px 0 0" }}
          >
            Kode: <strong style={{ color: "#e6edf3" }}>{game.code}</strong>
          </p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            padding: "6px 12px",
            background: "#21262d",
            color: "#8b949e",
            border: "1px solid #30363d",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          Keluar
        </button>
      </div>

      <div style={{ padding: "14px 12px" }}>
        {/* Status bar always visible */}
        <div style={{ ...S.panel, marginBottom: 12 }}>
          <StatusBar players={players} />
        </div>

        {game.phase === "distribution" && (
          <DistributionPanel
            cards={cards}
            players={players}
            gameId={gameId}
            onRefresh={loadData}
          />
        )}
        {game.phase === "night" && (
          <NightPanel
            game={game}
            players={players}
            gameId={gameId}
            onRefresh={loadData}
          />
        )}
        {game.phase === "day" && (
          <DayPanel game={game} players={players} gameId={gameId} onRefresh={loadData} />
        )}
        {game.phase === "voting" && (
          <VotingModeratorPanel
            game={game}
            players={players}
            gameId={gameId}
            onRefresh={loadData}
          />
        )}
        {game.phase === "gameover" && (
          <div style={{ ...S.panel, textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: "4rem" }}>
              {game.winner === "warga" ? "🎉" : "🐺"}
            </div>
            <h2
              style={{
                color: game.winner === "warga" ? "#3fb950" : "#f87171",
                fontWeight: 800,
              }}
            >
              {game.winner === "warga" ? "WARGA MENANG!" : "WEREWOLF MENANG!"}
            </h2>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 20,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {players
                .filter((p) => p.status === "alive")
                .map((p) => (
                  <span
                    key={p.id}
                    style={{
                      padding: "5px 12px",
                      background: "rgba(63,185,80,0.15)",
                      border: "1px solid #3fb950",
                      borderRadius: 20,
                      color: "#3fb950",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    {ROLE_INFO[p.role].emoji} {p.name}
                  </span>
                ))}
            </div>
            <button
              onClick={() => {
                window.location.href = "/moderator/new";
              }}
              style={{
                ...S.btn("linear-gradient(135deg,#1f6feb,#388bfd)"),
                marginTop: 24,
                maxWidth: 280,
              }}
            >
              🔄 Main Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
