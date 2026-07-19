"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface NightActionCardProps {
  title: string;
  icon: string;
  description: string;
  color: "blue" | "red" | "purple" | "yellow";
  children: ReactNode;
}

export function NightActionCard({ title, icon, description, color, children }: NightActionCardProps) {
  const colors = {
    blue: "border-blue-500/50 bg-blue-950/20 text-blue-100",
    red: "border-red-500/50 bg-red-950/20 text-red-100",
    purple: "border-purple-500/50 bg-purple-950/20 text-purple-100",
    yellow: "border-yellow-500/50 bg-yellow-950/20 text-yellow-100",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border backdrop-blur-md shadow-2xl ${colors[color]}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}