# Changelog - Werewolf Multiplayer

Semua perubahan dan fitur baru yang ditambahkan ke dalam game Werewolf Multiplayer didokumentasikan di bawah ini.

## [1.1.0] - 2026-07-19

### 🚀 Fitur Baru
- **Phase Countdown Timer (Sinkronisasi Waktu Fase)**
  - Menambahkan kolom `phase_end_at` pada tabel `games` untuk sinkronisasi waktu berakhirnya fase secara *real-time*.
  - Mengimplementasikan komponen `GameTimer` yang muncul di dashboard pemain untuk menghitung mundur durasi fase.
  - Membantu menjaga ritme permainan agar tetap dinamis dan konsisten antar pemain.

- **Graveyard Chat (Obrolan Arwah)**
  - Menambahkan fitur obrolan eksklusif bagi pemain yang sudah tereliminasi (`status: 'dead'`).
  - Menggunakan *Supabase Realtime Channel* (`chat:graveyard:{gameId}`) untuk komunikasi instan.
  - Memastikan pemain yang mati tetap terlibat secara sosial tanpa membocorkan informasi kepada pemain yang masih hidup.

### 🛠️ Perubahan Teknis
- **Database**: Penambahan kolom `phase_end_at` (TIMESTAMPTZ) melalui file migrasi `20260719114700_add_phase_end_at_to_games.sql`.
- **Types**: Pembaruan interface `Game` di `lib/types.ts` dengan menyertakan `phase_end_at: string | null`.
- **Frontend**: Integrasi komponen `GameTimer` dan `GraveyardChat` ke dalam `app/play/[gameId]/page.tsx` dengan logika rendering kondisional.