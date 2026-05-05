# QA Testing Report — Werewolf Multiplayer

## 🔴 BUG KRITIS

### 1. `VotingModeratorPanel` menggunakan Supabase client langsung untuk update game (bypass API) menggunakan Supabase client langsung untuk update game (bypass API)

**File:** `app/moderator/[gameId]/page.tsx` — `handleCancelVoting()`  
**Masalah:** `handleCancelVoting` memanggil `createClient()` (browser client dengan anon key) dan langsung update tabel `games`. Ini akan gagal karena RLS policy `games_mod_update` mengharuskan `auth.uid() = moderator_id`, tapi yang memanggil adalah browser client tanpa sesi moderator yang sudah terotorisasi dengan benar.  
Sama juga terjadi di `VotingGlobalModeratorPanel.handleCancelVoting()`.  
**Fix:** Gunakan fetch ke `/api/game/action` dengan action baru `cancel_voting`, sama seperti action lainnya.

---

### 3. Race condition pada `night_actions.killId` di Werewolf flow

**File:** `app/api/game/action/route.ts` — case `ww_vote`  
**Masalah:** Saat Werewolf voting (`ww_vote`), server membaca `game.night_actions` lalu merge `wwVotes`. Jika dua Werewolf submit secara bersamaan, keduanya bisa membaca state yang sama dan salah satu update hilang (last-write-wins pada Supabase update biasa, tanpa atomic compare-and-swap).  
**Dampak:** Vote salah satu Werewolf bisa tertimpa.  
**Fix:** Gunakan Supabase RPC dengan `jsonb_set` atau fungsi database untuk atomic merge.

---

### 4. `night_actions` bisa menjadi `null` sehingga crash saat destructuring

**File:** `app/api/game/action/route.ts` — case `process_night`  
**Masalah:** `const { killId, healId } = payload;` mengambil dari `payload` request, BUKAN dari `game.night_actions`. Jadi moderator harus mengirimkan `killId` dan `healId` secara manual. Di panel NightPanel, `cfg.nextAction` untuk `peramal` step memanggil:

```js
callAction("process_night", {
  killId: game.night_actions.killId,
  healId: game.night_actions.healId,
});
```

Jika `game.night_actions` adalah `null` (bukan `{}`), ini akan crash.  
**Fix:** Selalu pastikan `night_actions` diinisialisasi sebagai `{}` bukan `null`. Tambahkan nullish fallback: `game.night_actions?.killId`.

---

### 5. Hunter revenge dari voting siang tidak memicu `hunter_revenge` dengan benar

**File:** `app/api/game/action/route.ts` — case `execute_vote`  
**Masalah:** Action `execute_vote` (eksekusi langsung moderator) mengupdate `phase: "night"` dan `night_step: "hunter_revenge"` tapi tidak mereset `night_actions`, sehingga `hunterSubmitted` dari malam sebelumnya bisa masih ada.  
**Fix:** Reset night_actions saat masuk ke `hunter_revenge` dari siang hari.

---

<!--
### 6. `vote_candidates` bertipe `TEXT[]` di SQL tapi `JSONB` di migration 002

**File:** `README.md` vs `supabase/migrations/002_voting.sql`
**Masalah:** README menyebutkan `vote_candidates TEXT[] DEFAULT '{}'`, tapi migration 002 menambahkan kolom sebagai `jsonb default '[]'::jsonb`. Tipe tidak konsisten antara dokumentasi dan kode aplikasi yang memperlakukan ini sebagai array string (di TypeScript: `string[]`).
**Dampak:** Bisa menyebabkan query error tergantung setup Supabase.
**Fix:** Pilih satu tipe, standardisasi ke `TEXT[]` atau `JSONB[]` konsisten.

---

### 7. `DayPanel` — tombol "Voting Semua" tidak menunggu konfirmasi

**File:** `app/moderator/[gameId]/page.tsx` — `doStartVotingGlobal()`
**Masalah:** Tidak ada konfirmasi sebelum memulai voting global. Moderator bisa tidak sengaja tap tombol.
**Rekomendasi:** Tambahkan dialog konfirmasi.

--- -->

## 🟡 BUG MINOR / POTENSI MASALAH

### 8. `sessionStorage` tidak tersedia di SSR

**File:** `app/play/[gameId]/page.tsx`  
**Masalah:** Banyak komponen mengakses `sessionStorage.getItem(...)` di top-level, tapi ada guard `typeof window !== "undefined"`. Namun beberapa tempat mengakses langsung tanpa guard (misal di dalam event handler, aman). Perlu pastikan tidak ada yang jalan saat SSR.  
**Status:** Sebagian besar sudah aman, tapi perlu audit menyeluruh.

---

### 9. Peramal bisa melihat dirinya sendiri di `PeramalNightUI`

**File:** `app/play/[gameId]/page.tsx`  
**Masalah:** `aliveTargets` untuk Peramal sudah filter `p.id !== myId` dengan benar di `PlayerDashboard`, tapi di `PeramalNightUI` komponen standalon tidak ada filter tersebut — semua alive player termasuk dirinya sendiri bisa dipilih.  
**Fix:** Pastikan filtering `p.id !== myId` dilakukan sebelum dikirim ke `PeramalNightUI`.  
**Catatan:** Di `PlayerDashboard`, sudah ada: `players.filter(p => p.status === "alive" && p.id !== myId)`. Ini sudah benar. ✅

---

### 10. `players` di `PlayPage` tidak memuat `role` (tipe `PlayerPublic`)

**File:** `app/play/[gameId]/page.tsx`  
**Masalah:** `PlayerPublic` hanya memiliki `id, name, status, slot`. Query players di `loadData` hanya select `id,name,status,slot`. Tapi di `PlayerDashboard`, komponen mencoba `players.find(p => p.id === killId)?.name` — ini OK karena name ada. Tapi `ROLE_INFO` dipanggil di `PlayerDashboard` ketika menampilkan voting — tidak ada `role` di `PlayerPublic`, sehingga tidak ada bug langsung tapi perlu diperhatikan.

---

### 11. Tidak ada loading state saat `loadData` sedang berjalan di moderator page

**File:** `app/moderator/[gameId]/page.tsx`  
**Masalah:** Jika koneksi lambat, `game` masih `null` dan hanya menampilkan "Memuat..." tanpa feedback lebih lanjut. Minor UX issue.

---

### 12. `generate_game_code` tidak menjamin uniqueness

**File:** `supabase/migrations/001_init.sql`  
**Masalah:** Fungsi `generate_game_code()` menghasilkan kode random 6 karakter tapi tidak cek duplikasi. Constraint `UNIQUE` di tabel `games` akan throw error jika collision terjadi.  
**Fix:** Tambahkan retry loop di fungsi atau tangani error di API.

---

### 13. `type-check` script tidak akan berjalan karena `typescript` tidak ada di `dependencies`

**File:** `package.json`  
**Masalah:** `tsc --noEmit` dipanggil di script tapi `typescript` hanya ada sebagai `peer` (tidak di `devDependencies` eksplisit di package.json). Di `package-lock.json` ada dengan flag `"peer": true`. Bisa gagal di fresh install tanpa `--legacy-peer-deps`.  
**Fix:** Tambahkan `typescript` ke `devDependencies` secara eksplisit.

---

## ✅ KONFIRMASI DESAIN YANG SUDAH BENAR

### `proxy.ts` — Konvensi Next.js 16

**File:** `proxy.ts`  
Di Next.js 16, file `middleware.ts` sudah deprecated dan digantikan oleh `proxy.ts` dengan export function `proxy()`. Project ini sudah menggunakan konvensi yang benar sesuai dokumentasi terbaru. ✅

---

## ✅ FLOW YANG BERJALAN DENGAN BENAR

- Distribusi kartu + claim atomik dengan guard `picked=false` ✅
- Rollback player jika insert gagal setelah card claim ✅
- Realtime subscription di semua panel ✅
- Win condition check setelah setiap eksekusi ✅
- Hunter revenge dari malam (via night_kill) ✅
- Voting VS — tally, tie detection, tiebreaker ✅
- Voting Global — threshold >50%, skip (self-vote) ✅
- Peramal result disimpan di `night_actions` dan ditampilkan di moderator ✅
- Game deletion redirect pemain ke home ✅
- `proxy.ts` menggunakan konvensi Next.js 16 yang benar (bukan middleware.ts) ✅
