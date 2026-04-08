# NASAB — Manual Book
## Platform Silsilah Keluarga Modern Indonesia
**Versi 5.1.0** | Oleh M Sopian Hadianto — Labbaik AI

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Memulai](#2-memulai)
3. [Dashboard](#3-dashboard)
4. [Canvas — Pohon Keluarga](#4-canvas--pohon-keluarga)
5. [Mengelola Anggota](#5-mengelola-anggota)
6. [NIK Intelligence](#6-nik-intelligence)
7. [Peta (Geotagging)](#7-peta-geotagging)
8. [Daftar & Filter](#8-daftar--filter)
9. [Statistik & Timeline](#9-statistik--timeline)
10. [Insights](#10-insights)
11. [Kalkulator Faraidh](#11-kalkulator-faraidh)
12. [Kolaborasi (RBAC)](#12-kolaborasi-rbac)
13. [Import / Export](#13-import--export)
14. [Admin Panel](#14-admin-panel)
15. [Tema (Dark / Light)](#15-tema-dark--light)
16. [PWA — Install ke Home Screen](#16-pwa--install-ke-home-screen)
17. [Keyboard & Gesture](#17-keyboard--gesture)
18. [FAQ](#18-faq)

---

## 1. Pendahuluan

NASAB ("Jaga Nasabmu") adalah platform silsilah keluarga berbasis web yang dirancang khusus untuk Indonesia. Fitur utama:

- Pohon keluarga interaktif dengan drag & drop
- Kalkulator waris Islam (Faraidh) dengan wasiat wajibah
- NIK Intelligence — auto-fill data dari Nomor Induk Kependudukan
- Geotagging lokasi keluarga di peta Indonesia
- Multi-tenant — kelola banyak silsilah sekaligus
- Kolaborasi RBAC (Owner / Editor / Viewer)
- PWA — bisa di-install sebagai aplikasi

### Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Frontend | React 19 + Vite |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Hosting | Cloudflare Pages |

---

## 2. Memulai

### 2.1 Registrasi

1. Buka aplikasi NASAB
2. Klik **"Daftar Gratis"**
3. Isi: **Nama**, **Email**, **Password**
4. Klik **"Buat Akun"**
5. Otomatis login ke dashboard

### 2.2 Login

1. Isi **Email** dan **Password**
2. Klik **"Masuk"**

### 2.3 Lupa Password

1. Di halaman login, klik **"Lupa Password?"**
2. Isi **Nama** (sesuai akun terdaftar), **Email**, dan **Password Baru**
3. Klik **"Reset Password"**
4. Login dengan password baru

> **Catatan**: Nama harus sama persis (case-insensitive) dengan yang terdaftar.

---

## 3. Dashboard

Setelah login, Anda masuk ke **Dashboard** yang menampilkan:

- **Daftar silsilah** — semua keluarga yang Anda miliki atau diundang
- **Statistik per silsilah** — jumlah anggota dan lokasi geotagged
- **Role badge** — menunjukkan peran Anda (Owner/Editor/Viewer)

### Membuat Silsilah Baru

1. Klik kartu **"+ Buat Silsilah Baru"**
2. Isi **Nama Keluarga** dan **Deskripsi** (opsional)
3. Klik **"Buat"**
4. Otomatis masuk ke workspace silsilah

### Membuka Silsilah

- **Klik** kartu keluarga untuk membuka
- **Hover** kartu untuk prefetch data (loading lebih cepat)

---

## 4. Canvas — Pohon Keluarga

Canvas adalah tampilan utama untuk melihat dan mengedit pohon keluarga secara visual.

### 4.1 Navigasi Canvas

| Aksi | Desktop | Mobile |
|------|---------|--------|
| Pan (geser) | Klik & drag area kosong | Geser 1 jari |
| Zoom | Scroll mouse wheel | Pinch 2 jari |
| Zoom ke card | Double-click card | Double-tap card |

### 4.2 Tombol Kontrol (kanan bawah)

| Tombol | Fungsi |
|--------|--------|
| **+** | Zoom in |
| **-** | Zoom out |
| **Kotak** (Fit) | Tampilkan seluruh pohon |
| **Rumah** | Kembali ke tampilan nyaman, centered di root |

### 4.3 Elemen Visual

- **Card** — kotak berisi: avatar inisial, nama, tanggal lahir, lokasi. Warna border biru (laki-laki) atau pink (perempuan)
- **Garis NIKAH** — garis putus-putus pink menghubungkan pasangan, dengan badge "NIKAH"
- **Garis keturunan** — garis teal dari orangtua ke anak, dengan label jumlah (contoh: "6 Anak", "3 Cucu")
- **Drop line** — garis ke masing-masing anak, biru (laki-laki) atau pink (perempuan) dengan titik endpoint
- **Generation Lanes** — strip warna di sisi kiri menandai generasi (Kakek/Nenek, Ayah/Ibu, Anak, Cucu, Cicit, Canggah)
- **Minimap** — overview kecil di kiri bawah

### 4.4 Drag & Drop

- **Drag card** untuk memindahkan posisi anggota
- Posisi otomatis tersimpan ke server
- Klik tombol **Fit** untuk auto-layout ulang

---

## 5. Mengelola Anggota

### 5.1 Tambah Anggota

1. Klik tombol **"+ Tambah"** di toolbar
2. Isi form:
   - **NIK** (opsional) — 16 digit, auto-fill gender/tanggal lahir/provinsi
   - **Nama** (wajib)
   - **Gender** — Laki-laki / Perempuan
   - **Agama** — Islam, Kristen, Katolik, Hindu, Buddha, Konghucu, Lainnya
   - **Tanggal Lahir** dan **Wafat**
   - **Tempat Lahir**
   - **Orang Tua** — pilih dari dropdown (atau "Root" jika generasi pertama)
   - **Pasangan** — pilih dari dropdown
   - **Catatan**
   - **Lokasi** — cari alamat atau isi koordinat manual
3. Klik **"Tambah"**

### 5.2 Edit Anggota

1. Klik card anggota di canvas → sidebar terbuka
2. Klik tombol **Edit** di sidebar
3. Ubah data yang diinginkan
4. Klik **"Simpan"**

### 5.3 Hapus Anggota

1. Klik card → sidebar terbuka
2. Klik tombol **Hapus** (merah)
3. Konfirmasi penghapusan

> **Catatan**: Anggota yang masih punya anak tidak bisa dihapus. Hapus anak-anaknya terlebih dahulu.

### 5.4 Detail Sidebar

Klik card anggota untuk melihat:

- Avatar, nama, generasi, status (hidup/almarhum), agama
- **NIK** (masked, klik untuk toggle tampilkan)
- Tanggal lahir, usia, lokasi
- Jumlah keturunan
- Catatan
- **Hubungan**: parent, spouse, siblings, children — klik nama untuk navigasi

---

## 6. NIK Intelligence

NIK (Nomor Induk Kependudukan) adalah 16 digit ID nasional Indonesia. NASAB dapat mengekstrak informasi dari NIK:

### Cara Penggunaan

1. Di form tambah/edit, masukkan **16 digit NIK**
2. Preview otomatis muncul: **gender**, **tanggal lahir**, **provinsi**
3. Klik tombol **"Auto-fill"** untuk mengisi otomatis:
   - Gender
   - Tanggal lahir
   - Tempat lahir (nama provinsi)
   - Geotag (koordinat ibukota provinsi)

### Validasi & Masking

- NIK divalidasi (harus 16 digit angka)
- Progress counter saat mengetik (x/16)
- Di sidebar, NIK ditampilkan **masked**: `320105******1234`
- Klik NIK di sidebar untuk toggle tampilkan/sembunyikan

### Provinsi yang Didukung

34 provinsi Indonesia dari Aceh (11) sampai Papua Barat (92), lengkap dengan koordinat.

---

## 7. Peta (Geotagging)

Tab **"Peta"** menampilkan lokasi anggota keluarga di peta interaktif.

### Fitur Peta

- **Dark map** (CartoDB Dark) dengan marker berwarna per generasi
- **Filter generasi** — klik legend untuk filter tampilan
- **Popup** — klik marker untuk lihat nama dan alamat
- **Auto-fit** — peta otomatis zoom ke area yang ada marker

### Menambah Lokasi

1. Edit anggota → bagian **Lokasi**
2. **Cari alamat**: ketik nama tempat → klik hasil pencarian (geocoding OpenStreetMap)
3. **Manual**: isi latitude, longitude, dan alamat
4. Simpan

---

## 8. Daftar & Filter

Tab **"Daftar"** menampilkan semua anggota dalam format list.

### Filter

Bar filter di atas daftar mendukung:

| Filter | Opsi |
|--------|------|
| Gender | Semua / Laki-laki / Perempuan |
| Generasi | Semua / Kakek-Nenek / Ayah-Ibu / Anak / Cucu / ... |
| Status | Semua / Hidup / Almarhum |
| Lokasi | Semua / per kota |
| NIK | Semua / Ada NIK / Tanpa NIK |

Klik **"Reset"** untuk menghapus semua filter.

---

## 9. Statistik & Timeline

### Tab Stats

Menampilkan 8 metrik:

- Total anggota, Laki-laki, Perempuan
- Hidup, Almarhum
- Jumlah generasi
- Geotagged
- Rata-rata anak

### Tab Timeline

Menampilkan peristiwa keluarga secara kronologis:

- Kelahiran (titik teal)
- Kematian (titik abu-abu)
- Format tanggal Indonesia

---

## 10. Insights

Tab **"Insights"** berisi fitur analisis:

### 10.1 Pencari Hubungan (Relationship Finder)

1. Pilih **Orang 1** dan **Orang 2** dari dropdown
2. Klik **"Cari"**
3. Sistem menghitung jalur hubungan menggunakan BFS pathfinding
4. Tampilkan: label hubungan + jalur visual (A → B → C)

### 10.2 Ulang Tahun (Birthday Tracker)

Menampilkan anggota yang berulang tahun dalam **90 hari ke depan**:
- Badge "TODAY" untuk hari ini
- Hitungan mundur (contoh: "7d")
- Usia yang akan dicapai

### 10.3 Distribusi

- Bar chart distribusi per generasi (warna-warni)
- Top 6 kota/lokasi anggota

### 10.4 Fakta

Statistik cepat: persentase gender, geotagged, anggota dengan anak terbanyak, keturunan terbanyak.

### 10.5 Cerita Keluarga (Family Stories)

1. Pilih anggota (opsional) atau "Cerita umum"
2. Tulis cerita/kenangan
3. Klik **"Simpan"**
4. Cerita muncul dengan tanggal, nama anggota, dan penulis

---

## 11. Kalkulator Faraidh

Kalkulator hukum waris Islam berdasarkan ilmu faraidh.

### 11.1 Membuka Kalkulator

Klik tombol **"Timbangan"** di toolbar workspace.

### 11.2 Mode Otomatis

1. Pilih **Almarhum** dari dropdown (hanya anggota yang punya tanggal wafat)
2. Sistem otomatis:
   - Mendeteksi ahli waris dari silsilah (suami/istri, anak, orangtua, saudara)
   - Memeriksa agama setiap ahli waris
   - Memblokir ahli waris beda agama dari faraidh
   - Menampilkan warning merah

### 11.3 Mode Manual

Isi jumlah ahli waris secara manual:
- Suami (0-1), Istri (0-4)
- Anak Laki-laki, Anak Perempuan (0-20)
- Ayah, Ibu, Kakek, Nenek (0-1)
- Saudara Laki-laki, Saudara Perempuan (0-10)

### 11.4 Harta Waris

Masukkan total harta waris dalam Rupiah. Format otomatis.

### 11.5 Pembagian

Tabel hasil menampilkan:

| Kolom | Keterangan |
|-------|------------|
| Ahli Waris | Nama + tipe (fardh/asabah) |
| Jumlah | Berapa orang |
| Bagian | Fraksi + persentase |
| Hak | Jumlah Rupiah |
| Per Orang | Jika lebih dari 1 orang |

**Tipe bagian:**
- **Fardh** (hijau) — bagian tetap sesuai Al-Quran (1/2, 1/4, 1/8, 1/3, 1/6, 2/3)
- **Asabah** (kuning) — bagian sisa

**Kasus khusus:**
- **Awl** — jika total bagian fardh melebihi harta, dikurangi proporsional
- **Sisa** — jika tidak ada asabah, sisa dikembalikan ke baitul mal

### 11.6 Wasiat Wajibah

Jika ada ahli waris **beda agama** yang terblokir:

1. Panel warning merah muncul otomatis
2. Centang **"Hitung Wasiat Wajibah"**
3. Dua tab muncul:
   - **(A) Faraidh Murni** — pembagian hanya untuk ahli waris Muslim
   - **(B) Dengan Wasiat Wajibah** — tabel wasiat wajibah (maks 1/3 harta, sesuai KHI Pasal 209) + faraidh dari sisa harta

> **Disclaimer**: Kalkulator ini menggunakan hukum faraidh dasar. Untuk kasus kompleks (wasiat, hutang, radd, dll), konsultasikan dengan ahli waris atau ulama.

---

## 12. Kolaborasi (RBAC)

### 12.1 Mengundang Kolaborator

1. Klik tombol **Share** di toolbar workspace
2. Masukkan **email** yang akan diundang
3. Pilih **role**: Editor atau Viewer
4. Klik **"Undang"**

### 12.2 Role & Hak Akses

| Role | Lihat | Tambah/Edit | Hapus | Invite | Kelola |
|------|-------|-------------|-------|--------|--------|
| **Owner** | Ya | Ya | Ya | Ya | Ya |
| **Editor** | Ya | Ya | Ya | Tidak | Tidak |
| **Viewer** | Ya | Tidak | Tidak | Tidak | Tidak |

### 12.3 Cara Kerja Invite

- Jika email **sudah terdaftar** → langsung bergabung
- Jika email **belum terdaftar** → undangan tersimpan, aktif saat user register dengan email tersebut

---

## 13. Import / Export

### Export

1. Klik tombol **Download** di toolbar
2. Tab **"Export"** aktif
3. Data JSON seluruh anggota ditampilkan
4. Copy atau simpan sebagai file .json

### Import

1. Klik tombol **Download** di toolbar
2. Pindah ke tab **"Import"**
3. Paste data JSON (format array of members)
4. Klik **"Import"**
5. Anggota baru ditambahkan ke silsilah

### Format JSON

```json
[
  {
    "name": "Nama Lengkap",
    "gender": "male",
    "birthDate": "1990-01-15",
    "deathDate": "",
    "birthPlace": "Jakarta",
    "notes": "Catatan",
    "parentId": null,
    "spouseId": null,
    "nik": "",
    "agama": "islam",
    "location": {
      "lat": -6.21,
      "lng": 106.85,
      "address": "Jakarta, Indonesia"
    }
  }
]
```

---

## 14. Admin Panel

Tersedia untuk user dengan role **admin** atau **super_admin**.

### Mengakses Admin Panel

1. Di dashboard, klik tombol **"Admin Panel"** (ungu)

### Tab Statistik

Menampilkan total platform: Users, Families, Members, Stories.

### Tab Users

- Daftar semua user dengan jumlah keluarga
- **Ubah role**: klik dropdown role → pilih user/admin/super_admin
- **Hapus user**: tombol hapus (hanya super_admin)

### Tab Families

Daftar semua keluarga di platform dengan owner, jumlah anggota, dan kolaborator.

### Hierarki Role Platform

| Role | Hak |
|------|-----|
| **Super Admin** | Semua + hapus user + promosi admin |
| **Admin** | Lihat semua keluarga + kelola user biasa |
| **User** | Hanya keluarga sendiri/diundang |

---

## 15. Tema (Dark / Light)

### Toggle Tema

Klik tombol tema di header:
- **Matahari** = beralih ke Light mode
- **Bulan** = beralih ke Dark mode

Tombol tersedia di semua halaman: Login, Dashboard, Workspace, Admin.

Pilihan tema **tersimpan** dan tidak hilang saat refresh/reload.

### Dark Mode (default)

Background gelap (#07090e), teks terang. Nyaman untuk penggunaan malam.

### Light Mode

Background putih (#f4f6f9), teks gelap. Shadow halus pada card. Cocok untuk penggunaan siang.

---

## 16. PWA — Install ke Home Screen

NASAB adalah Progressive Web App yang bisa di-install.

### Install di Android (Chrome)

1. Buka NASAB di Chrome
2. Banner **"Install NASAB"** muncul di bawah → klik **"Install"**
3. Atau: menu tiga titik → **"Add to Home Screen"**

### Install di iOS (Safari)

1. Buka NASAB di Safari
2. Tap tombol **Share** (kotak dengan panah atas)
3. Scroll ke bawah → tap **"Add to Home Screen"**
4. Tap **"Add"**

### Install di Desktop (Chrome/Edge)

1. Klik ikon **install** di address bar (kanan)
2. Atau: banner "Install NASAB" → klik **"Install"**

### Keunggulan PWA

- Buka tanpa browser (standalone mode)
- Bisa akses offline (data yang pernah dibuka ter-cache)
- Loading lebih cepat (service worker cache)
- Icon di home screen seperti native app

---

## 17. Keyboard & Gesture

### Desktop

| Input | Aksi |
|-------|------|
| Scroll wheel | Zoom in/out (ke posisi kursor) |
| Klik + drag canvas | Pan |
| Klik + drag card | Pindahkan card |
| Klik card | Buka sidebar detail |
| Double-click card | Zoom ke card (toggle 45%/70%/100%) |

### Mobile

| Gesture | Aksi |
|---------|------|
| 1 jari geser canvas | Pan |
| 1 jari geser card | Pindahkan card |
| Pinch 2 jari | Zoom in/out |
| Tap card | Buka sidebar detail |
| Double-tap card | Zoom ke card |

---

## 18. FAQ

**Q: Berapa maksimum anggota per silsilah?**
A: Tidak ada batas teknis. Telah diuji dengan 27+ anggota. Performa optimal di bawah 200 anggota.

**Q: Apakah data aman?**
A: Data disimpan di Cloudflare D1 (edge database). Password di-hash dengan SHA-256. Token berlaku 30 hari.

**Q: Bisa diakses offline?**
A: Ya, setelah install PWA. Data yang pernah dibuka tersimpan di cache. Perubahan baru memerlukan koneksi internet.

**Q: Bagaimana jika lupa password DAN lupa nama akun?**
A: Hubungi administrator platform untuk reset manual melalui database.

**Q: Apakah NIK disimpan di server?**
A: Ya, tapi ditampilkan dalam format masked (tersembunyi) di UI. Hanya user yang punya akses ke keluarga tersebut yang bisa melihat.

**Q: Kalkulator Faraidh sudah benar?**
A: Kalkulator mencakup kasus umum (fardh, asabah, awl, wasiat wajibah). Untuk kasus kompleks, konsultasikan dengan ulama.

**Q: Bagaimana cara menghapus keluarga?**
A: Saat ini penghapusan keluarga dilakukan melalui Admin Panel atau database langsung.

---

**NASAB v5.1.0** | M Sopian Hadianto | Labbaik AI
