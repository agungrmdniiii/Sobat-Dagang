# 🛒 SobatDagang POS & Inventory

<div align="center">

![SobatDagang Banner](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/store.svg)

### Sistem Kasir Digital (POS) & Manajemen Inventori UMKM Modern

[![React 19](https://img.shields.io/badge/React-19.0.1-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite 6](https://img.shields.io/badge/Vite-6.2-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/badge/Motion-v12-f43f5e?style=flat-square)](https://motion.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

*Aplikasi web Point of Sale (POS) dan manajemen inventori toko ritel/sembako yang cepat, elegan, dan siap pakai. Dilengkapi kontrol hak akses kasir/admin, analitik penjualan, sistem onboarding interaktif, serta mode latihan untuk pelatihan staf kasir baru.*

</div>

---

## 🌟 Highlight Fitur

### 1. ⚡ Kasir POS (Point of Sale) Cerdas
- **Pencarian Cepat & Scan Barcode**: Input pencarian terintegrasi barcode scanner USB/kamera. Tekan `/` untuk langsung fokus dan tekan Enter untuk menambahkan produk otomatis saat kode SKU cocok.
- **Filter Kategori Dinamis**: Chip kategori produk sembako (Beras, Minyak, Gula, Kopi, Mie Instan, dll.) dengan palet warna pastel yang ramah mata.
- **Umpan Balik Visual Interaktif**: Efek kartu berkedip halus, animasi ikon terbang ke keranjang belanja, dan badge jumlah membal saat produk ditambahkan.
- **Kontrol Keranjang Lengkap**: 
  - Stepper jumlah item dengan fitur *hold-to-repeat*.
  - Catatan khusus per item barang.
  - *Swipe* ke kiri untuk menghapus item dengan jendela **Undo 5 detik**.
  - Tombol kosongkan keranjang yang aman dengan konfirmasi modal.
- **Tahan Transaksi (Hold Cart - F2)**: Simpan sementara keranjang pelanggan yang sedang mengantre untuk melayani pembeli lain terlebih dahulu, lalu lanjutkan kembali kapan saja.
- **Proses Pembayaran Cepat**:
  - Format angka Rupiah otomatis tanpa spinner input standar.
  - Pilihan **Uang Cepat** cerdas: tombol *Uang Pas* dan pecahan uang terdekat di atas total belanja.
  - Penghitungan uang kembalian *realtime* beranimasi Count-Up.
  - Dukungan metode pembayaran **Tunai** dan **QRIS** (panduan verifikasi mutasi manual).
- **Struk Digital & Cetak**: Struk transaksi siap cetak via printer thermal browser (`Ctrl+P` / tombol Cetak).

### 2. 🔐 Kontrol Peran & Keamanan Akun (RBAC)
- **Role-Based Access Control**:
  - **Admin**: Akses penuh ke Dashboard, Inventori, Laporan Penjualan, Manajemen Pengguna, dan Pengaturan Sistem.
  - **Kasir**: Akses fokus ke POS Kasir dan menu **Riwayat Saya** (daftar transaksi shift hari ini, buka struk ulang, dan ringkasan tutup kasir tanpa membuka data omzet rahasia toko).
- **Enkripsi Kata Sandi (Hash PBKDF2/SHA-256)**: Password disimpan dalam bentuk hash aman menggunakan Web Crypto API.
- **Indikator Kekuatan Password**: Evaluasi real-time saat pembuatan kata sandi (Lemah, Sedang, Kuat, Sangat Kuat).
- **Reset Password Wajib**: Admin dapat mereset akun staf dengan password sementara; pengguna diwajibkan membuat password baru saat pertama kali login.
- **Proteksi Admin Terakhir**: Sistem melarang admin menurunkan hak akses atau menghapus akun miliknya sendiri jika merupakan satu-satunya admin aktif.

### 3. 📦 Manajemen Inventori & Stok
- **Master Data Produk**: Kode SKU, nama barang, kategori, satuan (pcs, kg, liter, dll.), harga beli (modal), harga jual, dan foto produk/avatar inisial.
- **Peringatan Stok Minimum**: Status persediaan otomatis (*Aman*, *Hampir Habis*, atau *Habis*) dengan batas restok yang dapat disesuaikan.
- **Edit Stok Cepat**: Stepper penyesuaian stok langsung dari tabel/kartu disertai tombol pemulihan (*Undo*).
- **Draf Otomatis & Kuota Penyimpanan**: Menyimpan draf penambahan produk otomatis dan memantau sisa kuota `localStorage` browser.
- **Ekspor CSV**: Unduh seluruh daftar barang inventori ke format spreadsheet `.csv`.

### 4. 📊 Laporan & Analitik Penjualan (Khusus Admin)
- **Filter Periode Fleksibel**: Hari Ini, 7 Hari Terakhir, 30 Hari, dan Rentang Tanggal Kustom (*Date Range Picker* dengan preset cepat).
- **Kartu Ringkasan KPI**: Total Omzet, Total Transaksi, Laba Bersih Estimasi, dan Rata-rata Nilai Keranjang (AOV).
- **Grafik Interaktif Recharts**: Visualisasi omzet harian dan diagram persentase metode pembayaran (Tunai vs QRIS).
- **Filter Riwayat Transaksi**: Cari nomor invoice, kasir yang bertugas, atau rincian item barang.
- **Ekspor CSV Laporan**: Unduh rekap pembukuan penjualan lengkap ke file `.csv`.

### 5. 🎓 Sistem Onboarding & Pusat Bantuan
- **Modal Sambutan Pertama Login (`WelcomeModal`)**: Sambutan interaktif personal dengan 3 poin ringkas sesuai peran pengguna.
- **Tur Interaktif Mandiri (`GuidedTour`)**:
  - Spotlight berlubang dinamis menggunakan SVG mask tanpa dependensi library eksternal yang berat.
  - Popover pemandu otomatis menyesuaikan posisi layar dengan navigasi keyboard (`Enter`, panah, `Esc`).
  - Tur otomatis berpindah menu halaman jika langkah berikutnya berada di modul berbeda.
  - Tur khusus Kasir (8 langkah alur transaksi) dan Admin (11 langkah navigasi toko).
- **Checklist "Mulai di Sini"**: Widget mengambang di pojok kanan bawah yang otomatis mencentang tugas awal saat pengguna menyelesaikan aksi riil.
- **Pusat Bantuan (`HelpCenterDrawer`)**:
  - Panduan langkah demi langkah bergaya accordion dengan pencarian live kata kunci.
  - Tabel pintasan keyboard lengkap.
  - FAQ toko dan kontak darurat supervisor.
- **Mode Latihan (Practice Mode)**: Salinan data sementara yang memungkinkan kasir baru mencoba transaksi jual-beli dan perubahan stok tanpa memengaruhi database asli toko.

---

## ⌨️ Daftar Pintasan Keyboard (Hotkeys)

| Pintasan | Lokasi | Aksi |
| :--- | :--- | :--- |
| <kbd>/</kbd> | POS Kasir / Inventori | Fokus cepat ke kolom pencarian / scan barcode |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> | Global | Buka **Command Palette** global |
| <kbd>Shift</kbd> + <kbd>/</kbd> (<kbd>?</kbd>) | Global | Buka **Pusat Bantuan & Tutorial** |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | POS Kasir | Proses & buka modal konfirmasi pembayaran |
| <kbd>F2</kbd> | POS Kasir | Tahan transaksi saat ini (*Hold Cart*) |
| <kbd>N</kbd> | Inventori | Buka formulir Tambah Produk Baru |
| <kbd>Esc</kbd> | Modal / Drawer | Tutup modal atau panel yang sedang aktif |

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/)
- **Bundler & Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animasi & Transisi**: [Motion](https://motion.dev/) (Framer Motion v12) dengan dukungan `<MotionConfig reducedMotion="user">`
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **State & Penyimpanan**: React Hooks + `localStorage` browser (tanpa perlu backend database rumit saat tahap deployment awal)
- **Keamanan Kriptografi**: Web Crypto API (`crypto.subtle` PBKDF2 with SHA-256)

---

## 🚀 Panduan Memulai (Quick Start)

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18.0 atau yang lebih baru
- Package manager `npm`, `pnpm`, atau `yarn`

### Instalasi

1. **Clone repositori**:
   ```bash
   git clone https://github.com/username/sobatdagang-pos.git
   cd sobatdagang-pos
   ```

2. **Pasang dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

4. **Build untuk produksi**:
   ```bash
   npm run build
   ```
   Hasil build siap disajikan di folder `dist/`.

---

## 🔑 Akun Demo Pengujian

Saat pertama kali dibuka, sistem menyediakan akun bawaan untuk pengujian:

| Username | Password | Role | Akses Fitur |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **Admin** | Akses penuh (Dashboard, POS, Inventori, Laporan, Pengguna) |
| `kasir` | `kasir123` | **Kasir** | POS Penjualan & Riwayat Saya |

> 💡 *Catatan: Anda dapat membuat kasir baru atau mengubah kata sandi melalui menu Manajemen Pengguna (login sebagai Admin).*

---

## 📁 Struktur Direktori

```text
├── src/
│   ├── components/
│   │   ├── auth/          # Halaman Login & Ganti Password Wajib
│   │   ├── dashboard/     # Kartu KPI, Grafik Omzet, Peringatan Stok
│   │   ├── global/        # Sidebar, Topbar, Command Palette, Settings
│   │   ├── inventory/     # Manajemen Produk, Form SKU, Edit Stok
│   │   ├── motion/        # Komponen animasi reusable (PageTransition, CountUp)
│   │   ├── pos/           # Modul Kasir, Keranjang, Modal Bayar, Riwayat Saya
│   │   ├── reports/       # Laporan Penjualan, Filter Tanggal, Ekspor CSV
│   │   ├── ui/            # Komponen dasar (Button, Modal, Drawer, Toast, Table)
│   │   └── users/         # Manajemen Pengguna & Hak Akses
│   ├── features/
│   │   └── onboarding/    # GuidedTour, WelcomeModal, Checklist, HelpCenter, PracticeMode
│   ├── hooks/             # Custom hooks (useHotkeys, useLocalStorage, useUndoToast)
│   ├── lib/               # Utility functions, Crypto hashing, Permission matrix
│   ├── types.ts           # Definisi TypeScript interface & enum
│   ├── constants.ts       # Data awal produk & kategori sembako
│   ├── App.tsx            # Root application layout & state orchestrator
│   └── main.tsx           # Entry point React
├── public/                # Asset statis
├── package.json
└── vite.config.ts
```

---

## 🤝 Kontribusi

Kontribusi selalu diterima! Jika Anda menemukan bug atau memiliki ide perbaikan fitur:
1. Fork repositori ini
2. Buat branch fitur baru (`git checkout -b fitur/fitur-keren`)
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur keren'`)
4. Push ke branch (`git push origin fitur/fitur-keren`)
5. Buat **Pull Request** baru

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT](LICENSE). Silakan gunakan, pelajari, dan modifikasi untuk kebutuhan usaha dagang Anda!

<div align="center">
  Dibuat dengan ❤️ untuk kemajuan UMKM & Toko Kelontong Indonesia
</div>
