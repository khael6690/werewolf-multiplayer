"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LobbyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    const { createClient } = await import("../lib/supabase/client");
    const supabase = createClient();
    const { data } = await supabase
      .from("games")
      .select("id,phase")
      .eq("code", clean)
      .single();
    if (!data) {
      setError("Kode game tidak ditemukan!");
      return;
    }
    router.push(`/play/${data.id}`);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d0f14",
        gap: 16,
      }}
    >
      <div
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 14,
          padding: "32px 28px",
          width: 340,
        }}
      >
        <h1
          style={{
            color: "#f0c040",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: 800,
            marginBottom: 4,
          }}
        >
          🐺 WEREWOLF
        </h1>
        <p
          style={{
            color: "#8b949e",
            textAlign: "center",
            fontSize: "0.82rem",
            marginBottom: 28,
          }}
        >
          Multiplayer Realtime
        </p>
        <form onSubmit={handleJoin}>
          <label
            style={{
              color: "#8b949e",
              fontSize: "0.78rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Kode Game (6 huruf)
          </label>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            placeholder="Contoh: WOLF42"
            maxLength={6}
            style={{
              display: "block",
              width: "100%",
              marginTop: 6,
              marginBottom: 4,
              padding: "10px 14px",
              background: "#0d1117",
              color: "#e6edf3",
              border: `1px solid ${error ? "#dc2626" : "#30363d"}`,
              borderRadius: 8,
              fontSize: "1.2rem",
              textTransform: "uppercase",
              letterSpacing: 4,
              textAlign: "center",
              fontWeight: 700,
            }}
          />
          {error && (
            <p
              style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: 8 }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "11px",
              background: "linear-gradient(135deg,#1a7f37,#2ea043)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            🎮 Gabung Game
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a
            href="/login"
            style={{
              color: "#8b949e",
              fontSize: "0.8rem",
              textDecoration: "none",
            }}
          >
            🔑 Saya Moderator →
          </a>
        </div>
      </div>
    </div>
  );
}
