# Werewolf Multiplayer 🐺

Aplikasi web permainan Werewolf berbasis realtime yang dimainkan secara online. Dibuat menggunakan **Next.js**, **React**, dan **Supabase** (Authentication, Database, & Realtime).

Permainan ini membutuhkan satu perangkat utama (Laptop/Tablet) untuk bertindak sebagai **Moderator**, dan setiap pemain akan menggunakan perangkat pribadi mereka (HP) untuk melihat peran, berdiskusi rahasia, serta melakukan voting secara sinkron (real-time).

---

## ⚙️ Persyaratan Sistem (Prerequisites)

Sebelum mulai, pastikan kamu telah memiliki dan menginstal:
- **Node.js** (Minimal versi 18.x atau lebih baru)
- **npm** (Node Package Manager)
- Akun **[Supabase](https://supabase.com)** (Untuk database dan websocket/realtime engine)

---

## 🚀 Cara Instalasi

### 1. Kloning Repository & Install Dependencies
Buka terminal dan jalankan perintah berikut di direktori yang kamu inginkan:
```bash
# Install seluruh dependency yang dibutuhkan
npm install
```

### 2. Setup Supabase
Aplikasi ini sangat bergantung pada Supabase. Ikuti langkah ini:
1. Buat Project baru di [Supabase Dashboard](https://app.supabase.com/).
2. Masuk ke menu **SQL Editor** di Supabase, dan jalankan Query berikut untuk membuat tabel-tabel yang dibutuhkan:

```sql
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  moderator_id UUID NOT NULL,
  phase TEXT NOT NULL DEFAULT 'setup',
  night_round INTEGER DEFAULT 0,
  night_step TEXT,
  night_actions JSONB DEFAULT '{}'::jsonb,
  winner TEXT,
  vote_candidates TEXT[] DEFAULT '{}',
  vote_round INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL,
  role TEXT NOT NULL,
  player_id UUID,
  picked BOOLEAN DEFAULT false
);

CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'alive',
  slot INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE game_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  voter_id UUID REFERENCES players(id) ON DELETE CASCADE,
  target_id UUID REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, round, voter_id)
);
```

3. **Aktifkan Realtime**: Buka menu **Database** > **Replication** di dashboard Supabase. Aktifkan *Supabase Realtime* untuk keempat tabel berikut agar permainan bisa sinkron secara langsung:
   - `games`
   - `cards`
   - `players`
   - `votes`

4. Matikan RLS (Row Level Security) untuk uji coba lokal, atau atur Policy agar bisa diakses secara publik/anonim untuk operasi Insert & Select.

### 3. Konfigurasi Environment Variables
Buat file bernama `.env.local` di root direktori project, dan isi dengan kredensial Supabase kamu (bisa didapat di menu **Project Settings > API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```
> **Peringatan:** `SUPABASE_SERVICE_ROLE_KEY` dapat mem-bypass semua aturan database. Jangan pernah diekspos ke klien publik selain di server API (backend Next.js).

---

## 🏃‍♂️ Menjalankan Aplikasi

Jalankan perintah berikut untuk menyalakan mode development:

```bash
npm run dev
```

Aplikasi akan berjalan di alamat `http://localhost:3000`.

---

## 🎮 Cara Bermain

1. **Moderator (Pemandu Permainan)**
   - Buka `http://localhost:3000/login` dari laptop atau tablet.
   - Setup jumlah total pemain dan komposisi peran (Warga, Werewolf, Peramal, Dokter, dsb).
   - Layar akan menampilkan 6 digit **Kode Room**. Minta semua pemain untuk menggunakan kode tersebut.
   - Selama game berlangsung, kendalikan alur Siang dan Malam melalui layar Moderator ini. Layar ini harus menjadi pusat kendali.

2. **Pemain**
   - Pemain membuka `http://localhost:3000/play` melalui HP/browser masing-masing.
   - Pemain melihat kode yang diinfokan moderator.
   - Setiap pemain memilih "Kartu" secara acak dan menginputkan nama mereka.
   - Peran otomatis terlihat di layar HP. **Rahasiakan dari siapapun!**
   - Sistem akan otomatis merubah UI HP setiap pemain menyesuaikan apakah sedang fase "Siang", "Malam" atau giliran karakter khusus (seperti Werewolf yang bisa melihat dan voting WW lainnya di HP saat malam hari).
