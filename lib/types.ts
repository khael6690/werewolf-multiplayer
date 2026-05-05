export type Role = "Warga" | "Werewolf" | "Peramal" | "Dokter" | "Hunter";
export type Phase =
  | "setup"
  | "distribution"
  | "night"
  | "day"
  | "voting"
  | "gameover";
export type NightStep = "werewolf" | "dokter" | "peramal" | "hunter_revenge";
export type PlayerStatus = "alive" | "dead";

export interface Game {
  id: string;
  code: string;
  moderator_id: string;
  phase: Phase;
  night_round: number;
  night_step: NightStep | null;
  night_actions: {
    killId?: string;
    healId?: string;
    hunterKillId?: string;
    wwVotes?: Record<string, string>;
    dokterSubmitted?: boolean;
    seerTargetId?: string;
    seerResult?: string;
    peramalSubmitted?: boolean;
    hunterSubmitted?: boolean;
  };
  winner: "warga" | "werewolf" | null;
  vote_candidates: string[];
  vote_round: number;
  hide_role: boolean;
  created_at: string;
}

export interface Card {
  id: string;
  game_id: string;
  slot: number;
  role: Role;
  player_id: string | null;
  picked: boolean;
}

export interface CardPublic {
  id: string;
  game_id: string;
  slot: number;
  picked: boolean;
  player_name?: string;
}

export interface Player {
  id: string;
  game_id: string;
  card_id: string | null;
  name: string;
  role: Role;
  status: PlayerStatus;
  slot: number;
  joined_at: string;
}

export interface PlayerPublic {
  id: string;
  name: string;
  status: PlayerStatus;
  slot: number;
}

export interface GameEvent {
  id: string;
  game_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Vote {
  id: string;
  game_id: string;
  round: number;
  voter_id: string;
  target_id: string;
  created_at: string;
}

export interface VotePublic {
  id: string;
  voter_id: string;
  voter_name: string;
  target_id: string;
  target_name: string;
}

export const ROLE_INFO: Record<
  Role,
  { emoji: string; color: string; desc: string }
> = {
  Warga: {
    emoji: "👤",
    color: "#86efac",
    desc: "Kamu warga biasa. Gunakan logika untuk menemukan Werewolf!",
  },
  Werewolf: {
    emoji: "🐺",
    color: "#f87171",
    desc: "Kamu Werewolf! Setiap malam pilih korban. Siang hari berpura-puralah!",
  },
  Peramal: {
    emoji: "🔮",
    color: "#bc8cff",
    desc: "Setiap malam kamu bisa mengintip identitas satu pemain.",
  },
  Dokter: {
    emoji: "💉",
    color: "#93c5fd",
    desc: "Setiap malam selamatkan satu pemain dari serangan Werewolf.",
  },
  Hunter: {
    emoji: "🏹",
    color: "#fcd34d",
    desc: "Jika terbunuh, bawa satu pemain mati bersamamu!",
  },
};
