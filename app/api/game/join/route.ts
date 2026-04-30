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

  const { data: card } = await admin.from('cards').select('*').eq('id', cardId).single()
  if (!card || card.picked)
    return NextResponse.json({ error: 'Kartu sudah diambil!' }, { status: 409 })

  const { data: player, error: pErr } = await admin
    .from('players')
    .insert({ game_id: gameId, card_id: cardId, name: name.trim(), role: card.role, slot: card.slot, status: 'alive' })
    .select().single()
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  await admin.from('cards').update({ picked: true, player_id: player.id }).eq('id', cardId)
  await admin.from('game_events').insert({
    game_id: gameId, type: 'card_picked',
    payload: { playerId: player.id, name: name.trim(), slot: card.slot },
  })

  return NextResponse.json({ playerId: player.id, role: card.role, slot: card.slot })
}
