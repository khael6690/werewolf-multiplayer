"use client";
import { useState } from "react";
import { NightActionCard } from "./night-actions";
import { PlayerPublic } from "../../lib/types";

export function DokterNightUI({ 
  gameId, 
  myId, 
  players, 
  onActionComplete 
}: { 
  gameId: string, 
  myId: string, 
  players: PlayerPublic[], 
  onActionComplete?: () => void 
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
    onActionComplete?.();
  }

  return (
    <NightActionCard 
      title="Pilih Pasien" 
      icon="💉" 
      description="Pilih satu pemain untuk diselamatkan malam ini."
      color="blue"
    >
      {!submitted ? (
        <div className="grid gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelId(p.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selId === p.id 
                  ? "border-blue-500 bg-blue-500/20 text-white" 
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              }`}
            >
              {p.name} {p.id === myId && "(kamu)"}
            </button>
          ))}
          {selId && (
            <button
              onClick={handleHeal}
              disabled={loading}
              className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white shadow-lg shadow-blue-900/50"
            >
              {loading ? "Menyimpan..." : "Simpan Pilihan"}
            </button>
          )}
        </div>
      ) : (
        <p className="text-center text-blue-300 font-semibold">Tindakan telah dikunci.</p>
      )}
    </NightActionCard>
  );
}