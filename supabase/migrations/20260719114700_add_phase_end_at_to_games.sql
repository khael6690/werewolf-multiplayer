-- Menambahkan kolom phase_end_at ke tabel games untuk fitur countdown timer
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS phase_end_at TIMESTAMPTZ;

-- Menambahkan komentar untuk dokumentasi
COMMENT ON COLUMN public.games.phase_end_at IS 'Timestamp kapan fase saat ini akan berakhir. Digunakan untuk countdown timer di client.';