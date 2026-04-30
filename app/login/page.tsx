"use client";
import { useState } from "react";
import { createClient } from "./../../lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });
    setSent(true);
    setLoading(false);
  }

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
            marginBottom: 8,
          }}
        >
          🐺 WEREWOLF
        </h1>
        <p
          style={{
            color: "#8b949e",
            textAlign: "center",
            fontSize: "0.82rem",
            marginBottom: 24,
          }}
        >
          Moderator Login
        </p>
        {sent ? (
          <div
            style={{ color: "#3fb950", textAlign: "center", lineHeight: 1.6 }}
          >
            ✅ Magic link terkirim!
            <br />
            <span style={{ color: "#8b949e", fontSize: "0.85rem" }}>
              Cek email kamu untuk masuk.
            </span>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label
              style={{
                color: "#8b949e",
                fontSize: "0.78rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Email Moderator
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="kamu@email.com"
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                marginBottom: 16,
                padding: "10px 14px",
                background: "#0d1117",
                color: "#e6edf3",
                border: "1px solid #30363d",
                borderRadius: 8,
                fontSize: "1rem",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                background: "linear-gradient(135deg,#1f6feb,#388bfd)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              {loading ? "Mengirim..." : "🔑 Kirim Magic Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
