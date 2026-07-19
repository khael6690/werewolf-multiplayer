"use client";
import { motion } from "framer-motion";
import { PlayerPublic } from "../../lib/types";

export function VotingPlayerPanel({ 
  candidates, 
  players, 
  myId, 
  onVote 
}: { 
  candidates: string[], 
  players: PlayerPublic[], 
  myId: string | null,
  onVote: (id: string) => void 
}) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {candidates.map((cId) => {
        const p = players.find((x) => x.id === cId);
        if (!p) return null;
        
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={cId}
            onClick={() => onVote(cId)}
            className="p-4 bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl hover:border-emerald-500/50 transition-all text-left"
          >
            <div className="text-2xl mb-2">{p.id === myId ? "👤" : "❓"}</div>
            <div className="font-bold text-slate-100">{p.name}</div>
            <div className="text-xs text-slate-400 mt-1">Tap untuk voting</div>
          </motion.button>
        );
      })}
    </div>
  );
}