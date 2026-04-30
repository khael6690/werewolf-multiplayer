import { createServerSupabase } from "../../../../lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { buildRoleDeck, validateRoleConfig } from "../../../../lib/game-logic";
import { NextResponse } from "next/server";
import type { Role } from "../../../../lib/types";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { total, roles } = body as {
    total: number;
    roles: Record<Role, number>;
  };

  const err = validateRoleConfig(total, roles);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: code } = await admin.rpc("generate_game_code");

  const { data: game, error: gErr } = await admin
    .from("games")
    .insert({ code, moderator_id: session.user.id, phase: "distribution" })
    .select()
    .single();
  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });

  const deck = buildRoleDeck(roles);
  const cards = deck.map((role, i) => ({
    game_id: game.id,
    slot: i + 1,
    role,
    picked: false,
  }));

  const { error: cErr } = await admin.from("cards").insert(cards);
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  return NextResponse.json({ gameId: game.id, code: game.code });
}
