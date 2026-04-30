import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Werewolf Multiplayer',
  description: 'Moderator dashboard untuk permainan Werewolf realtime',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
