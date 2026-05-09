# PROMPT-UX-SPRINT.md
# Paste seluruh isi file ini ke Claude Code (Antigravity) di terminal VS Code

---

## Task: NASAB UX Enhancement Sprint — Integrasi 3 Fitur ke `frontend/nasab.jsx`

Baca CLAUDE.md dan README.md dulu untuk memahami arsitektur NASAB. Lalu integrasikan 3 fitur UX berikut langsung ke `frontend/nasab.jsx` (production build, bukan root nasab.jsx).

**PENTING**: Jangan buat file baru. Semua fitur di-embed langsung ke dalam `frontend/nasab.jsx` yang sudah ada, mengikuti pola single-file SPA yang sudah berjalan. Gunakan design language yang sudah ada (Black & Gold glassmorphism, CSS variables `--bg`, `--surface`, `--gold`, `--text`, `--border`, dark/light theme support).

---

### FITUR 1: OnboardingWizard (Wizard 3 Langkah)

**Kapan muncul**: Setelah user berhasil create family baru (setelah POST `/api/families` sukses dan family workspace terbuka untuk pertama kali dengan 0 members).

**Alur wizard**:

1. **Step "Mulai dari Kamu"**
   - Input: Nama lengkap (required), Jenis kelamin (pilih Laki-laki/Perempuan, tampilan button toggle)
   - Auto-set: jika pilih Laki-laki, spouse gender otomatis Perempuan dan sebaliknya

2. **Step "Pasangan Hidup"**
   - Dua opsi: "Sudah Menikah" atau "Lewati"
   - Jika menikah: input nama pasangan
   - Jika lewati: langsung ke step 3

3. **Step "Orang Tua"**
   - Dua opsi: "Tambah Ortu" atau "Nanti Saja"
   - Jika tambah: input nama Ayah + nama Ibu
   - Jika nanti: tampilkan pesan "Bisa ditambah nanti dari Canvas"

**Saat "Mulai Pohon Keluarga" diklik**:
- Batch create members via existing API calls yang sudah ada di nasab.jsx:
  - POST diri sendiri sebagai member pertama (root)
  - POST pasangan (jika ada) + POST marriage
  - POST ayah + POST ibu (jika ada) + set parent_id pada diri sendiri
- Setelah selesai, reload family data dan tutup wizard
- Tampilkan toast "✨ X anggota berhasil ditambahkan!"

**UI Requirements**:
- Modal overlay dengan backdrop blur
- Progress bar 3 step di atas (gold active, border inactive)
- Animasi slide left/right saat pindah step
- Tombol "Lewati wizard, langsung mulai kosong" di bawah
- Responsive — max-width 440px, padding mobile-friendly
- Ikuti theme dark/light yang sudah ada

---

### FITUR 2: CanvasCardActions (Tombol + Kontekstual di Canvas)

**Di mana**: Setiap card member di Canvas view (di dalam fungsi render canvas yang sudah ada).

**Implementasi**:
- Tambahkan tombol `+` kecil (28x28px, bulat, warna gold) di pojok kanan atas setiap card canvas
- Tombol hanya muncul jika user role >= editor (cek dari `myRole` state yang sudah ada)
- Saat diklik: muncul radial/popup menu dengan 4 opsi:
  1. **👆 Orang Tua** — buka AddMemberModal dengan `parent_id` logic (member ini jadi child)
  2. **💍 Pasangan** — buka AddMemberModal sebagai spouse + auto-create marriage
  3. **👶 Anak** — buka AddMemberModal dengan `parent_id` = member ini
  4. **👥 Saudara** — buka AddMemberModal dengan `parent_id` = parent dari member ini (jika ada)

**Behavior**:
- Menu muncul sebagai radial popup di sekitar tombol + (atau dropdown sederhana jika radial terlalu complex)
- Klik di luar menu → tutup
- Setelah member berhasil ditambah via modal → auto-reload family data
- Smart disable: jika member sudah punya 2 orang tua, disable opsi "Orang Tua"
- Jangan tampilkan tombol + di card jika user adalah viewer

**UI**:
- Radial menu items: lingkaran 40px dengan emoji, warna border unik per tipe
- Tooltip label muncul on hover
- Animasi pop-in berurutan (stagger 50ms)

---

### FITUR 3: BottomNavBar (Navigasi Mobile)

**Di mana**: Render di bagian bawah layar, HANYA pada mobile (window.innerWidth < 768 atau deteksi via CSS media query / state).

**Tabs** (sesuaikan dengan view tabs yang sudah ada di nasab.jsx):
1. 🌳 **Pohon** → canvas view
2. 📋 **Daftar** → list view
3. 🗺️ **Peta** → map view
4. 📖 **Kisah** → insights/kisah view
5. 💬 **Feed** → keluarga view

**Implementasi**:
- Pada mobile: sembunyikan tab bar yang ada di atas, tampilkan BottomNavBar
- Pada desktop: tetap pakai tab bar atas yang sudah ada, jangan tampilkan BottomNavBar
- State `activeView` sudah ada — BottomNavBar cukup memanggil setter yang sama
- Deteksi mobile: `useState` + `useEffect` dengan `window.matchMedia('(max-width: 768px)')` listener

**UI**:
- Fixed bottom, z-index tinggi (di atas semua content)
- Glass effect background (backdrop-filter blur)
- Safe area padding untuk iPhone notch: `padding-bottom: max(8px, env(safe-area-inset-bottom))`
- Active tab: garis gold di atas + icon bounce + label bold
- Inactive: grayscale icon + warna dim
- Rounded top corners (border-radius: 20px 20px 0 0)
- Box shadow ke atas untuk depth
- Saat BottomNavBar aktif (mobile), tambahkan padding-bottom ~80px pada content area agar tidak tertutup

---

### Panduan Teknis Umum

1. **Jangan break existing code** — semua fitur baru ditambahkan, bukan mengganti yang ada
2. **Ikuti pola yang ada**: komponen di nasab.jsx menggunakan inline styles dan CSS-in-JS via `<style>` tags di dalam JSX
3. **State management**: gunakan state hooks yang sudah ada, tambahkan state baru seperlunya
4. **API calls**: gunakan fungsi `apiFetch()` atau pattern fetch yang sudah ada di nasab.jsx
5. **Theme aware**: semua warna baru harus support dark/light via CSS variables yang sudah ada
6. **Toast**: gunakan toast/notification system yang sudah ada di nasab.jsx (cari pattern `setToast` atau `setNotif` atau sejenisnya)
7. **Responsive**: BottomNavBar = mobile only, Wizard = responsive (max-width 440px), Canvas + = selalu tampil (desktop & mobile) tapi hanya untuk editor+
8. **Test setelah integrasi**: `cd frontend && npm run dev` lalu test:
   - Buat family baru → wizard muncul
   - Klik + di card canvas → radial menu muncul
   - Resize browser < 768px → bottom nav muncul, top tabs hilang
   - Resize > 768px → top tabs kembali, bottom nav hilang

---

### Urutan Eksekusi

1. Baca `frontend/nasab.jsx` untuk memahami struktur komponen, state, dan pattern yang ada
2. Identifikasi: di mana family creation handler, di mana canvas card render, di mana tab switching
3. Implementasi BottomNavBar (paling independen, risiko rendah)
4. Implementasi CanvasCardActions (medium complexity)
5. Implementasi OnboardingWizard (paling complex, perlu API calls)
6. Test semua 3 fitur
7. Build: `cd frontend && npm run build`
8. Deploy: `npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true`

Mulai sekarang. Baca file dulu, lalu eksekusi satu per satu.
