# Werewolf Multiplayer 🐺

Aplikasi web permainan Werewolf berbasis **realtime** yang dimainkan secara online. Dibuat menggunakan **Next.js 16**, **React 19**, dan **Supabase** (Authentication, Database & Realtime).

Satu perangkat bertindak sebagai **Moderator** (laptop/tablet), sementara setiap pemain menggunakan perangkat pribadi (HP) untuk melihat peran, berdiskusi rahasia, dan melakukan voting secara sinkron.

---

## 🎮 Fitur Utama

- **Distribusi kartu realtime** — Klaim kartu bersifat atomic (race-condition-safe), slot terkunci otomatis saat dipilih.
- **Fase Malam interaktif** — Werewolf berdiskusi & vote via HP masing-masing dengan sistem mufakat; Dokter memilih target selamat; Peramal mengintip identitas pemain — semuanya via HP, hasilnya langsung terlihat di layar moderator.
- **Vote Werewolf atomic** — Menggunakan Supabase RPC (`update_ww_vote`) untuk mencegah race condition saat beberapa Werewolf vote bersamaan.
- **Fase Siang** — Moderator memilih metode eksekusi: Eksekusi Langsung, Voting VS (2 kandidat), atau Voting Semua (majority rule >50%).
- **Cancel Voting** — Moderator bisa membatalkan sesi voting yang sedang berjalan dan kembali ke fase Siang.
- **Hunter revenge** — Jika Hunter terbunuh (malam/siang), mereka mendapat kesempatan balas dendam sebelum fase berlanjut.
- **Hide Role (Sembunyikan Peran)** — Opsi konfigurasi saat setup: role pemain yang mati/dieksekusi tidak diumumkan ke publik.
- **Voting transparan** — Semua pemain bisa melihat siapa memilih siapa secara realtime.
- **Win condition otomatis** — Kondisi menang diperiksa setiap kali ada pemain yang mati.
- **Retry kode game** — API create game otomatis retry hingga 5x jika terjadi collision kode unik.
- **Reset game** — Moderator bisa reset dan mulai game baru setelah game selesai.

---

## ⚙️ Persyaratan Sistem

- **Node.js** ≥ 20.9.0
- **npm**
- Akun **[Supabase](https://supabase.com)**

---

## 🚀 Cara Instalasi

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd werewolf-multiplayer
npm install
```

### 2. Setup Supabase

**a. Buat project baru** di [Supabase Dashboard](https://app.supabase.com/).

**b. Jalankan migration** via **SQL Editor** secara berurutan:

---

**Migration 1 — Tabel utama** (`supabase/migrations/001_init.sql`)

Buat tabel `games`, `cards`, `players`, `game_events`, aktifkan RLS dengan policy yang tepat, aktifkan Realtime, dan buat fungsi `generate_game_code()`. Jalankan file tersebut secara utuh.

---

**Migration 2 — Voting** (`supabase/migrations/002_voting.sql`)

Buat tabel `votes`, tambahkan kolom `vote_candidates` (jsonb) dan `vote_round` (int) ke tabel `games`, serta aktifkan Realtime untuk tabel `votes`.

---

**Migration 3 — RPC Atomic WW Vote** (`supabase/migrations/003_rpc.sql`)

```sql
create or replace function update_ww_vote(
  p_game_id uuid,
  p_voter_id text,
  p_target_id text
) returns void language plpgsql as $$
begin
  update public.games
  set night_actions = jsonb_set(
    coalesce(night_actions, '{}'::jsonb),
    '{wwVotes}',
    coalesce(night_actions->'wwVotes', '{}'::jsonb) || jsonb_build_object(p_voter_id, p_target_id)
  )
  where id = p_game_id;
end;
$$;
```

Fungsi ini memastikan vote Werewolf di-merge secara atomic di level database, mencegah race condition saat beberapa Werewolf submit vote bersamaan.

---

**Migration 4 — Hide Role** (`supabase/migrations/004_settings.sql`)

```sql
alter table public.games add column if not exists hide_role boolean not null default false;
```

---

**c. Aktifkan Realtime** — Buka **Database → Replication** di dashboard Supabase, pastikan Realtime aktif untuk tabel:

- `games`
- `cards`
- `players`
- `votes`

**d. Row Level Security** — File migration sudah menyertakan RLS policies lengkap. Untuk development lokal yang cepat, Anda bisa mematikan RLS sementara, tapi **jangan lakukan ini di production**.

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

Dapatkan nilai ini dari **Project Settings → API** di Supabase Dashboard.

> ⚠️ **Peringatan:** `SUPABASE_SERVICE_ROLE_KEY` mem-bypass semua RLS. Jangan pernah expose ke client-side atau commit ke git.

---

## 🏃‍♂️ Menjalankan Aplikasi

```bash
npm run dev
```

Akses di `http://localhost:3000`.

Untuk akses dari HP di jaringan lokal yang sama, tambahkan IP lokal kamu ke `allowedDevOrigins` di `next.config.mjs`:

```js
allowedDevOrigins: ['192.168.x.x'],
```

---

## 🎮 Cara Bermain

### Moderator (Pemandu Permainan)

1. Buka `http://localhost:3000/login`, masuk via magic link email.
2. Setup jumlah pemain, komposisi peran, dan aktifkan/nonaktifkan opsi **Hide Role** jika diinginkan.
3. Klik **Generate & Acak Kartu** — layar menampilkan **6 digit Kode Room**.
4. Bagikan kode ke semua pemain.
5. Tunggu semua pemain memilih kartu, lalu klik **Mulai Malam Pertama**.
6. Kendalikan alur Siang dan Malam dari layar Moderator.

### Pemain

1. Buka `http://localhost:3000` di HP.
2. Masukkan kode game dari moderator → **Gabung Game**.
3. Pilih salah satu kartu secara acak, masukkan nama.
4. **Ingat dan rahasiakan peran kamu!**
5. Ikuti instruksi di layar HP sesuai fase yang berjalan.

---

## 🃏 Peran yang Tersedia

| Peran        | Emoji | Kemampuan                                                                                                     |
| ------------ | ----- | ------------------------------------------------------------------------------------------------------------- |
| **Warga**    | 👤    | Tidak punya kemampuan khusus. Gunakan logika untuk menemukan Werewolf!                                        |
| **Werewolf** | 🐺    | Setiap malam voting memilih korban bersama Werewolf lain via HP. Semua WW harus sepakat sebelum kill dikunci. |
| **Peramal**  | 🔮    | Setiap malam bisa mengintip identitas satu pemain (Werewolf atau bukan) via HP.                               |
| **Dokter**   | 💉    | Setiap malam bisa menyelamatkan satu pemain dari serangan Werewolf via HP.                                    |
| **Hunter**   | 🏹    | Jika terbunuh (kapanpun), bawa satu pemain mati bersamamu sebagai pembalasan terakhir!                        |

---

## 🔄 Alur Permainan

```
Setup → Distribusi Kartu → [Malam → Siang]* → Game Over
```

**Fase Malam (dijalankan oleh moderator, aksi via HP masing-masing):**

1. **Werewolf** — Semua WW yang hidup voting siapa yang dibunuh. Butuh mufakat (semua pilih target sama) sebelum kill bisa dikonfirmasi.
2. **Dokter** — Memilih satu pemain untuk diselamatkan.
3. **Peramal** — Mengintip identitas satu pemain.
4. Moderator memproses malam → pengumuman korban di fase Siang.

**Fase Siang (moderator memilih metode eksekusi):**

- 🗳️ **Voting VS** — 2 kandidat dipilih moderator, semua pemain vote via HP. Moderator bisa cancel voting.
- 🌐 **Voting Semua** — Semua pemain vote bebas, butuh >50% untuk eksekusi, bisa skip. Moderator bisa cancel voting.
- ⚖️ **Eksekusi Langsung** — Moderator langsung eksekusi berdasarkan kesepakatan forum (dengan dialog konfirmasi).

**Opsi Hide Role:** Jika diaktifkan saat setup, peran pemain yang mati atau dieksekusi **tidak** diumumkan ke seluruh pemain.

**Kondisi Menang:**

- 🎉 **Warga menang** jika semua Werewolf tereliminasi.
- 🐺 **Werewolf menang** jika jumlah Werewolf ≥ jumlah warga yang tersisa.

---

## 🏗️ Struktur Project

```
├── app/
│   ├── api/
│   │   ├── auth/callback/     # OAuth callback Supabase
│   │   ├── game/action/       # Semua game actions (moderator & player)
│   │   │                      # Actions: cancel_voting, start_night, night_step,
│   │   │                      #   ww_vote (atomic RPC), ww_confirm_kill,
│   │   │                      #   dokter_heal, peramal_see, hunter_shoot,
│   │   │                      #   process_night, hunter_revenge, start_voting,
│   │   │                      #   cast_vote, end_voting, start_voting_global,
│   │   │                      #   end_voting_global, execute_vote, reset_game
│   │   ├── game/create/       # Buat game baru (dengan retry kode 5x)
│   │   └── game/join/         # Pemain join & claim kartu (atomic guard)
│   ├── login/                 # Halaman login moderator (magic link)
│   ├── moderator/
│   │   ├── layout.tsx         # Auth guard server-side
│   │   └── [gameId]/page.tsx  # Dashboard moderator lengkap
│   ├── play/[gameId]/page.tsx # Halaman pemain (semua role UI)
│   ├── page.tsx               # Lobby (input kode game)
│   └── globals.css
├── lib/
│   ├── game-logic.ts          # checkWin, buildRoleDeck, validateRoleConfig
│   ├── types.ts               # TypeScript types, Game interface (+ hide_role),
│   │                          # PlayerPublic (+ role?), ROLE_INFO
│   └── supabase/
│       ├── client.ts          # Browser Supabase client
│       └── server.ts          # Server Supabase client (SSR)
├── supabase/migrations/
│   ├── 001_init.sql           # Tabel utama, RLS, Realtime, generate_game_code()
│   ├── 002_voting.sql         # Tabel votes, kolom vote_candidates & vote_round
│   ├── 003_rpc.sql            # Fungsi update_ww_vote() — atomic WW vote
│   └── 004_settings.sql       # Kolom hide_role di tabel games
├── proxy.ts                   # Auth guard untuk /moderator (Next.js 16 convention)
├── next.config.mjs
└── vercel.json
```

---

## 🔧 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript check (tsc --noEmit)
```

## 🚀 Deploy ke Vercel

```bash
npm i -g vercel
vercel
```

Set environment variables di Vercel Dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Konfigurasi `vercel.json` sudah tersedia di root project.

---

## 🔒 Catatan Keamanan

- **Service Role Key** hanya digunakan di server-side API routes, tidak pernah dikirim ke client.
- **RLS** harus aktif di production untuk mencegah manipulasi data langsung dari client.
- Voting dan night actions divalidasi di server sebelum diproses — pemain tidak bisa curang via API langsung.
- Klaim kartu menggunakan atomic guard (`picked = false`) untuk mencegah double-claim.
- Vote Werewolf menggunakan Supabase RPC untuk merge atomic, mencegah data hilang akibat concurrent write.
- Auth guard moderator diimplementasikan di dua lapis: `proxy.ts` (Next.js 16 proxy convention) dan `app/moderator/layout.tsx` (server-side redirect).
