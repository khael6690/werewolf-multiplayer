import { createServerSupabase } from ../../lib/supabase/server
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { checkWin } from '@/lib/game-logic'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, gameId, payload } = await request.json()

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: game } = await admin.from('games').select('*').eq('id', gameId).single()
  if (!game || game.moderator_id !== session.user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  switch (action) {
    case 'start_night':
      await admin.from('games').update({ phase: 'night', night_round: game.night_round + 1, night_step: 'werewolf', night_actions: {} }).eq('id', gameId)
      break
    case 'night_step':
      await admin.from('games').update({ night_step: payload.step, night_actions: payload.actions }).eq('id', gameId)
      break
    case 'process_night': {
      const { killId, healId } = payload
      let killed = null
      if (killId && killId !== healId) {
        await admin.from('players').update({ status: 'dead' }).eq('id', killId)
        const { data: kp } = await admin.from('players').select('*').eq('id', killId).single()
        killed = kp
        await admin.from('game_events').insert({ game_id: gameId, type: 'night_kill', payload: { playerId: killId, name: kp?.name, role: kp?.role } })
      }
      if (killed?.role === 'Hunter') {
        await admin.from('games').update({ phase: 'night', night_step: 'hunter_revenge' }).eq('id', gameId)
        return NextResponse.json({ phase: 'hunter_revenge', killed })
      }
      await admin.from('games').update({ phase: 'day', night_step: null }).eq('id', gameId)
      return NextResponse.json({ phase: 'day', killed })
    }
    case 'hunter_revenge': {
      if (payload.hunterKillId)
        await admin.from('players').update({ status: 'dead' }).eq('id', payload.hunterKillId)
      await admin.from('games').update({ phase: 'day', night_step: null }).eq('id', gameId)
      break
    }
    case 'execute_vote': {
      const { playerId } = payload
      await admin.from('players').update({ status: 'dead' }).eq('id', playerId)
      const { data: vp } = await admin.from('players').select('*').eq('id', playerId).single()
      await admin.from('game_events').insert({ game_id: gameId, type: 'day_execute', payload: { playerId, name: vp?.name, role: vp?.role } })
      if (vp?.role === 'Hunter') {
        await admin.from('games').update({ phase: 'night', night_step: 'hunter_revenge' }).eq('id', gameId)
        return NextResponse.json({ phase: 'hunter_revenge', executed: vp })
      }
      const { data: players } = await admin.from('players').select('*').eq('game_id', gameId)
      const winner = checkWin(players ?? [])
      if (winner) {
        await admin.from('games').update({ phase: 'gameover', winner }).eq('id', gameId)
        await admin.from('game_events').insert({ game_id: gameId, type: 'game_over', payload: { winner } })
      }
      break
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
