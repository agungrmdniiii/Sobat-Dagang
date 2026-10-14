import { Role } from '../../types';
import { HelpGuide, FAQItem, KeyboardShortcut, ChecklistItem } from './types';

export const ONBOARDING_CHECKLIST_ITEMS: ChecklistItem[] = [
  // Kasir items
  {
    id: 'kasir_search',
    title: 'Cari satu produk',
    description: 'Ketik nama barang di kotak pencarian atau gunakan tombol "/"',
    roles: [Role.KASIR],
    targetView: 'pos',
  },
  {
    id: 'kasir_add_cart',
    title: 'Tambahkan produk ke keranjang',
    description: 'Klik kartu produk atau tekan tombol "+" untuk menambah jumlah',
    roles: [Role.KASIR],
    targetView: 'pos',
  },
  {
    id: 'kasir_complete_tx',
    title: 'Selesaikan satu transaksi',
    description: 'Lakukan proses pembayaran Tunai atau QRIS sampai selesai',
    roles: [Role.KASIR],
    targetView: 'pos',
  },
  {
    id: 'kasir_view_receipt',
    title: 'Lihat struk atau Riwayat Saya',
    description: 'Buka struk transaksi terakhir atau periksa halaman Riwayat Saya',
    roles: [Role.KASIR],
    targetView: 'my-history',
  },

  // Admin items
  {
    id: 'admin_add_product',
    title: 'Tambah produk pertama',
    description: 'Buka Inventori dan tambahkan produk baru ke dalam katalog',
    roles: [Role.ADMIN],
    targetView: 'inventory',
  },
  {
    id: 'admin_set_min_stock',
    title: 'Atur stok minimum',
    description: 'Tetapkan batas peringatan stok menipis pada salah satu produk',
    roles: [Role.ADMIN],
    targetView: 'inventory',
  },
  {
    id: 'admin_create_user',
    title: 'Buat akun kasir',
    description: 'Tambahkan akun kasir baru melalui menu Pengguna',
    roles: [Role.ADMIN],
    targetView: 'users',
  },
  {
    id: 'admin_test_tx',
    title: 'Lakukan satu transaksi uji',
    description: 'Coba lakukan satu penjualan di menu Kasir POS',
    roles: [Role.ADMIN],
    targetView: 'pos',
  },
  {
    id: 'admin_view_reports',
    title: 'Lihat laporan penjualan',
    description: 'Periksa grafik penjualan dan ringkasan omzet di menu Laporan',
    roles: [Role.ADMIN],
    targetView: 'reports',
  },
];

export const HELP_GUIDES: HelpGuide[] = [
  {
    id: 'guide-pos-sale',
    title: 'Cara Melakukan Penjualan di Kasir POS',
    category: 'Penjualan',
    iconName: 'ShoppingCart',
    summary: 'Panduan lengkap melayani pelanggan dari input barang hingga pembayaran selesai.',
    roles: [Role.KASIR, Role.ADMIN],
    tags: ['kasir', 'pos', 'jual', 'bayar', 'tunai', 'qris'],
    steps: [
      { number: 1, text: 'Buka menu "Kasir POS" dari sidebar.' },
      { number: 2, text: 'Cari produk dengan mengetik namanya atau tekan tombol "/" pada keyboard.' },
      { number: 3, text: 'Klik kartu produk atau tombol "+" untuk memasukkan ke keranjang.' },
      { number: 4, text: 'Klik "Proses Pembayaran" atau tekan pintasan "Ctrl + Enter".' },
      { number: 5, text: 'Pilih metode pembayaran Tunai atau QRIS, lalu klik tombol uang cepat untuk memasukkan nominal.' },
      { number: 6, text: 'Tekan "Konfirmasi Pembayaran" untuk menyelesaikan dan mencetak struk belanja.' },
    ],
  },
  {
    id: 'guide-hold-cart',
    title: 'Cara Menahan Transaksi (Hold)',
    category: 'Penjualan',
    iconName: 'PauseCircle',
    summary: 'Simpan sementara keranjang pelanggan yang sedang antre atau belum siap membayar.',
    roles: [Role.KASIR, Role.ADMIN],
    tags: ['hold', 'tahan', 'antre', 'f2', 'lanjutkan'],
    steps: [
      { number: 1, text: 'Saat ada item di keranjang kasir, tekan tombol "Tahan" atau pintasan keyboard "F2".' },
      { number: 2, text: 'Keranjang akan otomatis tersimpan sementara dan keranjang kasir kembali bersih untuk pelanggan berikutnya.' },
      { number: 3, text: 'Untuk melanjutkan transaksi tertahan, klik tombol "Tertahan (n)" di pojok kanan atas keranjang.' },
      { number: 4, text: 'Pilih transaksi yang ingin dilanjutkan lalu klik "Lanjutkan Transaksi".' },
    ],
  },
  {
    id: 'guide-close-shift',
    title: 'Cara Menutup Shift & Cetak Rekap Kasir',
    category: 'Kasir & Shift',
    iconName: 'History',
    summary: 'Rekapitulasi penjualan harian Anda, verifikasi total uang kasir, dan cetak ringkasan shift.',
    roles: [Role.KASIR, Role.ADMIN],
    tags: ['shift', 'tutup shift', 'riwayat', 'rekap', 'kasir'],
    steps: [
      { number: 1, text: 'Buka menu "Riwayat Saya" dari sidebar utama.' },
      { number: 2, text: 'Tinjau total transaksi dan nominal penjualan yang berhasil Anda buat hari ini.' },
      { number: 3, text: 'Klik tombol "Tutup Shift & Cetak Rekap" di sudut kanan atas halaman.' },
      { number: 4, text: 'Periksa rincian total tunai dan non-tunai pada ringkasan, lalu klik "Cetak Ringkasan Shift".' },
    ],
  },
  {
    id: 'guide-inventory-add',
    title: 'Cara Menambah & Mengelola Produk Baru',
    category: 'Inventori',
    iconName: 'Package',
    summary: 'Tambah produk ke katalog toko lengkap dengan harga modal, harga jual, dan stok awal.',
    roles: [Role.ADMIN],
    tags: ['produk', 'tambah barang', 'inventori', 'sku', 'barcode'],
    steps: [
      { number: 1, text: 'Buka menu "Inventori" dari sidebar grup Tools.' },
      { number: 2, text: 'Klik tombol "Tambah Produk" di sudut kanan atas.' },
      { number: 3, text: 'Isi kode produk/SKU, nama produk, kategori, harga modal, harga jual, dan stok awal.' },
      { number: 4, text: 'Atur batas "Stok Minimum" untuk peringatan otomatis saat barang mulai menipis.' },
      { number: 5, text: 'Klik "Simpan Produk" untuk menambahkan barang ke katalog penjualan.' },
    ],
  },
  {
    id: 'guide-manage-users',
    title: 'Cara Membuat Akun Kasir & Reset Kata Sandi',
    category: 'Pengguna',
    iconName: 'Users',
    summary: 'Kelola akses staf kasir, batasi hak peran, dan terapkan keamanan kata sandi.',
    roles: [Role.ADMIN],
    tags: ['pengguna', 'user', 'kasir', 'password', 'role', 'admin'],
    steps: [
      { number: 1, text: 'Buka menu "Pengguna" di grup Tools (khusus Administrator).' },
      { number: 2, text: 'Klik tombol "Tambah Pengguna" untuk membuka laci input.' },
      { number: 3, text: 'Masukkan Nama Lengkap, Username unik, pilih Peran (KASIR atau ADMIN), dan password awal.' },
      { number: 4, text: 'Jika kasir lupa password, klik tombol aksi "Reset Password" pada baris akunnya untuk memberikan sandi sementara yang wajib diganti.' },
    ],
  },
  {
    id: 'guide-reports-export',
    title: 'Cara Menganalisis Laporan & Ekspor ke CSV',
    category: 'Laporan',
    iconName: 'BarChart3',
    summary: 'Filter omzet penjualan berdasarkan rentang tanggal dan unduh data transaksi toko.',
    roles: [Role.ADMIN],
    tags: ['laporan', 'omzet', 'csv', 'ekspor', 'grafik', 'analisis'],
    steps: [
      { number: 1, text: 'Masuk ke menu "Laporan" dari sidebar.' },
      { number: 2, text: 'Pilih periode waktu: Hari Ini, 7 Hari Terakhir, 30 Hari, atau tentukan rentang tanggal kustom.' },
      { number: 3, text: 'Pantau grafik tren penjualan dan perincian laba kotor toko.' },
      { number: 4, text: 'Klik tombol "Ekspor CSV" di bagian atas untuk mengunduh rekap transaksi ke dalam file spreadsheet.' },
    ],
  },
];

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    keyCombo: ['/'],
    label: 'Cari Produk / Scan Barcode',
    description: 'Fokus instan ke kolom pencarian kasir POS',
    roles: [Role.KASIR, Role.ADMIN],
  },
  {
    keyCombo: ['Ctrl', 'Enter'],
    label: 'Proses Pembayaran',
    description: 'Buka modal pembayaran saat keranjang terisi',
    roles: [Role.KASIR, Role.ADMIN],
  },
  {
    keyCombo: ['F2'],
    label: 'Tahan Transaksi (Hold)',
    description: 'Simpan keranjang pelanggan saat ini secara cepat',
    roles: [Role.KASIR, Role.ADMIN],
  },
  {
    keyCombo: ['Ctrl', 'K'],
    label: 'Command Palette',
    description: 'Pencarian global cepat untuk produk, aksi, dan navigasi',
    roles: [Role.KASIR, Role.ADMIN],
  },
  {
    keyCombo: ['Shift', '/'],
    label: 'Buka Pusat Bantuan (?)',
    description: 'Buka laci panduan langkah demi langkah dan bantuan',
    roles: [Role.KASIR, Role.ADMIN],
  },
  {
    keyCombo: ['Esc'],
    label: 'Tutup Jendela / Modal',
    description: 'Tutup modal popup atau laci aktif yang sedang terbuka',
    roles: [Role.KASIR, Role.ADMIN],
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-storage',
    question: 'Di mana seluruh data transaksi dan produk disimpan?',
    answer: 'Semua data tersimpan secara aman di penyimpanan browser lokal (localStorage). Data tetap aman meskipun tab ditutup atau browser dibuka kembali pada perangkat yang sama.',
    category: 'Penyimpanan & Data',
    roles: [Role.KASIR, Role.ADMIN],
  },
  {
    id: 'faq-offline',
    question: 'Apakah aplikasi dapat berjalan saat internet terputus?',
    answer: 'Ya, SobatDagang dirancang dapat beroperasi penuh secara offline. Pencatatan transaksi, update stok, dan cetak struk tetap berfungsi lancar.',
    category: 'Koneksi',
    roles: [Role.KASIR, Role.ADMIN],
  },
  {
    id: 'faq-reprint',
    question: 'Bagaimana cara mencetak ulang struk transaksi lama?',
    answer: 'Kasir dapat membuka menu "Riwayat Saya", lalu klik tombol "Buka Struk" pada transaksi yang diinginkan, kemudian klik tombol "Cetak Struk". Admin juga dapat membukanya melalui menu Laporan.',
    category: 'Struk & Cetak',
    roles: [Role.KASIR, Role.ADMIN],
  },
  {
    id: 'faq-reset-tour',
    question: 'Bagaimana cara melihat panduan onboarding kembali?',
    answer: 'Buka menu Bantuan ini kapan saja, lalu pilih tombol "Ulangi Tur Interaktif" di bagian Mulai Cepat atau klik "Ulangi Semua Tutorial" di bagian bawah untuk mereset seluruh panduan awal.',
    category: 'Panduan',
    roles: [Role.KASIR, Role.ADMIN],
  },
  {
    id: 'faq-practice-mode',
    question: 'Apa fungsi Mode Latihan (Practice Mode)?',
    answer: 'Mode Latihan memungkinkan Anda atau staf kasir baru mencoba transaksi penjualan dan manajemen stok tanpa memengaruhi database toko asli. Saat keluar dari mode latihan, semua data dikembalikan ke kondisi semula.',
    category: 'Fitur',
    roles: [Role.KASIR, Role.ADMIN],
  },
];

export const ADMIN_CONTACT_INFO = {
  storeName: 'SobatDagang Retail POS',
  supportOfficer: 'Tim Supervisor & Admin Toko',
  whatsappNumber: '+62 812-3456-7890',
  operatingHours: 'Setiap Hari, 08:00 - 21:00 WIB',
  helpEmail: 'bantuan@sobatdagang.id',
};
