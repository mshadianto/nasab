# PROMPT-UX-SPRINT-PART2.md
# Lanjutan dari sprint sebelumnya. 3 fitur pertama sudah selesai (BottomNavBar, CanvasCardActions, OnboardingWizard).
# Copy-paste ke Claude Code (Antigravity) untuk eksekusi fitur 4, 5, 6.

---

## Context

Sprint sebelumnya sudah berhasil mengimplementasikan:
- BottomNavBar (mobile navigation)
- CanvasCardActions (tombol + di canvas cards)
- OnboardingWizard (3-step wizard saat family baru)

Sekarang lanjutkan dengan 3 fitur berikutnya. Semua aturan sama: edit langsung di `frontend/nasab.jsx`, jangan buat file baru, ikuti pattern dan design language yang sudah ada.

---

### FITUR 4: AI Story Trigger (Milestone Notification)

**Masalah**: Dari Admin Panel, Total Stories = 0 di seluruh platform. User tidak tahu fitur cerita/bio/kisah keluarga ada. Padahal ada `generateBio()` dan AI integration (Groq/Gemini/Claude) yang sudah jalan.

**Implementasi**: Tambahkan milestone popup yang muncul SATU KALI per family saat threshold tercapai.

**Logic** — taruh di dalam effect atau handler yang sudah me-load family data (setelah `members` state terisi):

```javascript
// Pseudo-code — sesuaikan dengan pattern yang ada di nasab.jsx
useEffect(() => {
  if (!members || !family) return;
  const fid = family.id;
  
  // Milestone 1: 5+ members
  if (members.length >= 5 && !localStorage.getItem(`nasab-ms5-${fid}`)) {
    // show milestone modal
    setMilestoneModal({ type: 'story', count: members.length, familyName: family.name });
    localStorage.setItem(`nasab-ms5-${fid}`, '1');
  }
  // Milestone 2: 15+ members  
  else if (members.length >= 15 && !localStorage.getItem(`nasab-ms15-${fid}`)) {
    setMilestoneModal({ type: 'advanced', count: members.length, familyName: family.name });
    localStorage.setItem(`nasab-ms15-${fid}`, '1');
  }
}, [members, family]);
```

**Milestone Modal type='story'** (5+ members):
- Judul: "Pohon keluarga mulai terbentuk!"
- Isi: "Keluarga [nama] sudah punya [N] anggota. Biarkan AI NASAB merangkum asal-usul keluarga ini menjadi cerita yang indah."
- Tombol 1: "Buat Kisah dengan AI" → tutup modal, switch view ke tab Kisah/Insights (set view state ke 'insights' atau 'kisah' — cari nama state yang benar), lalu delay 500ms dan trigger klik pada tombol generate bio yang sudah ada di InsightsView. Atau langsung call `generateBio()` jika accessible.
- Tombol 2: "Nanti Saja" → tutup modal

**Milestone Modal type='advanced'** (15+ members):
- Judul: "Pohon keluarga semakin besar!"
- Isi: "Sudah [N] anggota! Coba fitur lanjutan:"
- Tombol 1: "Kalkulator Faraidh" → tutup modal, switch view ke stats/faraidh (cari dimana Faraidh diakses)
- Tombol 2: "Ekspor GEDCOM" → tutup modal, trigger GEDCOM export (cari fungsi `toGedcom()` atau handler export yang sudah ada)
- Tombol 3: "Tutup" → tutup modal

**UI**:
- Modal overlay sama seperti OnboardingWizard (backdrop blur, glass card, centered)
- Emoji besar di atas (type='story' → "✨", type='advanced' → "🌳")
- Max-width 400px, padding 24px
- Animasi pop-in (scale 0.9 → 1)
- Tombol primary = gold gradient, secondary = outline

---

### FITUR 5: Empty State yang Helpful

**Untuk backward compatibility** — family lama yang sudah terlanjur punya 0 member (sebelum wizard diimplementasi).

**Implementasi**: Jika workspace terbuka dan `members.length === 0`, tampilkan empty state di Canvas area (bukan canvas kosong).

**Cari di nasab.jsx**: bagian yang render canvas/tree view saat `members` array kosong. Tambahkan kondisi:

```javascript
// Di dalam render Canvas view
if (members.length === 0) {
  return <EmptyFamilyState onAddSelf={...} onImportKK={...} onImportGedcom={...} />;
}
```

**EmptyFamilyState content**:
```
🌱

Pohon keluarga ini masih kosong

Mulai dengan menambah diri kamu sebagai 
anggota pertama, atau import data yang sudah ada.

[👤 Tambah Anggota]  [📷 Import KK]  [📄 Import GEDCOM]
```

**Handler untuk tombol**:
- "Tambah Anggota" → buka AddMemberModal yang sudah ada (cari state setter seperti `setShowAddModal(true)` atau `setEditingMember(null)` + open modal)
- "Import KK" → buka KKModal yang sudah ada (cari `setShowKK(true)` atau serupa)
- "Import GEDCOM" → trigger GEDCOM import file picker (cari handler import GEDCOM yang sudah ada, biasanya ada hidden file input)

**Juga tampilkan di List view dan Map view** jika 0 member — cari render branch untuk tiap view dan tambahkan empty state check.

**UI**:
- Centered vertically dan horizontally di area content
- Glass card background, border dashed gold (subtle)
- Emoji besar (40-48px)
- Teks muted untuk deskripsi
- Tombol: primary gold (Tambah), outline (Import KK, Import GEDCOM)
- Animasi subtle fade-in

---

### FITUR 6: Admin Panel — Family Health Indicators

**Di bagian admin families list** yang sudah ada di nasab.jsx. Cari bagian yang render tabel families di admin panel (tab "Families" di admin view).

**6a. Badge status di kolom Members**:
- Jika `members === 0`: tampilkan badge merah "Kosong" di samping angka 0
- Jika `members === 0` DAN `created_at` lebih dari 7 hari lalu: tampilkan badge orange "Stale" sebagai ganti "Kosong"
- Hitung 7 hari: `new Date() - new Date(family.created_at) > 7 * 24 * 60 * 60 * 1000`

**6b. Filter dropdown** di atas tabel families:
- Tambahkan dropdown/select di atas tabel: "Semua" | "Aktif (>0)" | "Kosong (0)" | "Stale (>7 hari)"
- State: `adminFamilyFilter` (default: 'all')
- Filter logic:
  - 'all': tampilkan semua
  - 'active': `family.member_count > 0`
  - 'empty': `family.member_count === 0`
  - 'stale': `family.member_count === 0 && isOlderThan7Days(family.created_at)`

**6c. Statistik ringkas** di atas tabel:
- Di bawah filter, tampilkan inline summary: "142 total · 98 aktif · 44 kosong · 12 stale"
- Hitung dari data families yang sudah di-load

**6d. Tombol "Bersihkan Family Kosong"** (super_admin only):
- Tombol di samping filter dropdown
- Untuk sekarang: **disabled** dengan tooltip "Perlu endpoint API baru"  
- Style: outline danger (merah), opacity 0.5 jika disabled
- Nanti setelah backend endpoint dibuat bisa diaktifkan

---

### Urutan Eksekusi

1. Baca ulang `frontend/nasab.jsx` — fokus pada:
   - State `members` dan kapan di-load (useEffect/handler)
   - Canvas view rendering saat members kosong
   - List view dan Map view rendering saat members kosong
   - Admin panel families tab dan tabel rendering
   - Fungsi `generateBio()`, KKModal, GEDCOM handler
   - View switching state name (untuk milestone → navigate ke Kisah)

2. Implementasi **Fitur 5** (Empty State) — paling sederhana, langsung visible
3. Implementasi **Fitur 4** (Milestone) — perlu state baru + modal
4. Implementasi **Fitur 6** (Admin badges + filter) — self-contained di admin section

5. **Test**: `cd frontend && npm run dev`
   - Buka family kosong (jika ada) → empty state muncul
   - Buka family dengan 5+ member → milestone popup (pertama kali saja)
   - Clear localStorage `nasab-ms5-*` untuk test ulang
   - Admin > Families → badge Kosong/Stale muncul, filter bekerja

6. **Build & Deploy**:
   ```bash
   cd frontend && npm run build
   npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true
   ```

7. **Bump** cache version string di `frontend/public/sw.js`

Mulai sekarang.
