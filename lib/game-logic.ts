import type { Player, Role } from './types'

export function checkWin(players: Player[]): 'warga' | 'werewolf' | null {
  const alive = players.filter(p => p.status === 'alive')
  const aliveWW = alive.filter(p => p.role === 'Werewolf').length
  const aliveGood = alive.filter(p => p.role !== 'Werewolf').length
  if (aliveWW === 0) return 'warga'
  if (aliveWW >= aliveGood) return 'werewolf'
  return null
}

export function buildRoleDeck(config: Record<Role, number>): Role[] {
  const deck: Role[] = []
  for (const [role, count] of Object.entries(config)) {
    for (let i = 0; i < count; i++) deck.push(role as Role)
  }
  return deck.sort(() => Math.random() - 0.5)
}

export function validateRoleConfig(total: number, config: Record<Role, number>): string | null {
  const sum = Object.values(config).reduce((a, b) => a + b, 0)
  if (sum !== total) return `Total role (${sum}) ≠ jumlah pemain (${total})`
  if ((config.Werewolf ?? 0) < 1) return 'Minimal 1 Werewolf!'
  return null
}
