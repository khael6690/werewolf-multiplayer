import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { gameId, cardId, name } = await request.json()
  if (!gameId || !cardId || !name?.trim())
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Step 1: Atomically claim the card ──────────────────────
  // UPDATE only if picked=false; if another request already flipped it
  // to true, this update will affect 0 rows → race condition prevented.
  const { data: claimed, error: claimErr } = await admin
    .from('cards')
    .update({ picked: true })
    .eq('id', cardId)
    .eq('picked', false)          // ← atomic guard
    .select('*')

  if (claimErr)
    return NextResponse.json({ error: claimErr.message }, { status: 500 })

  // If no rows were updated, the card was already taken
  if (!claimed || claimed.length === 0)
    return NextResponse.json({ error: 'Kartu sudah diambil!' }, { status: 409 })

  const card = claimed[0]

  // ── Step 2: Create the player record ───────────────────────
  const { data: player, error: pErr } = await admin
    .from('players')
    .insert({
      game_id: gameId,
      card_id: cardId,
      name: name.trim(),
      role: card.role,
      slot: card.slot,
      status: 'alive',
    })
    .select()
    .single()

  if (pErr) {
    // Rollback: release the card if player creation fails
    await admin.from('cards').update({ picked: false, player_id: null }).eq('id', cardId)
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  // ── Step 3: Link the player to the card ────────────────────
  await admin.from('cards').update({ player_id: player.id }).eq('id', cardId)

  await admin.from('game_events').insert({
    game_id: gameId,
    type: 'card_picked',
    payload: { playerId: player.id, name: name.trim(), slot: card.slot },
  })

  return NextResponse.json({ playerId: player.id, role: card.role, slot: card.slot })
}
