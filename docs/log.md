# Log Perubahan & Pengembangan Fradium

## 1. Refactor Struktur Folder (Koreksi)
- Semua komponen utama frontend dipindahkan dari `src/frontend/src/components` ke `src/frontend/src/core/components` dengan struktur modular:
  - `layouts/` untuk layout utama (Navbar, Footer, HomeLayout)
  - `sections/` untuk section-page (HeroSection, dst)
  - `ui/` untuk komponen UI (Button, Card, Container)
- Folder `components` lama dihapus agar tidak membingungkan dan seluruh import path sudah diperbaiki.

## 2. Penyesuaian Hero Section & About (Koreksi)
- Hero Section di-refactor agar sesuai design system Fradium dan referensi visual.
- Section full-screen (`100vw x 100vh`), responsif, konten selalu center.
- Ilustrasi kiri/kanan dibatasi max-width, tidak menyebabkan scroll horizontal.
- Semua style utama dipindahkan ke CSS Module (`hero-section.module.css`).
- Perbaikan bug scroll horizontal akibat gambar absolute yang terlalu besar.
- About Section di bawah Hero sudah responsif, ilustrasi dan label terpisah, style di CSS Module.

## 3. Penyesuaian Header/Navbar (Koreksi)
- Header di-refactor agar identik dengan desain referensi (logo kiri, menu center, button kanan).
- Button Sign In di Header menggunakan efek shadow ungu offset kiri bawah, tanpa border, dan sudut lancip.
- Semua style utama dipindahkan ke CSS Module (`header.module.css`).

## 4. Penyesuaian Button (UI) (Koreksi)
- Komponen Button diubah agar fixed size: width 180px, height 48px (desktop), 120x36 (mobile), konten center pakai flex, padding otomatis.
- Shadow ungu kiri bawah pakai box-shadow, tidak ada border-radius, tidak ada border.
- Warna hijau di depan, layer/shadow ungu di belakang (urutan layer sudah benar).
- Semua button di page pakai komponen ini, responsif di mobile.
- Perbaikan bug visual button: tidak ada lagi layer ungu di depan atau overlap konten.

## 5. Perbaikan Import Path (Koreksi)
- Semua import path di seluruh file sudah diupdate agar sesuai struktur baru hasil migrasi.
- Tidak ada lagi error "Does the file exist?" dari Vite.

## 6. Perbaikan Responsivitas (Koreksi)
- Hero Section, Header, dan About sudah responsif di semua resolusi.
- Padding, font-size, dan layout diatur agar tetap nyaman di mobile.

## 7. Pengembangan Section "How it works" (Baru)
- Menambahkan section "How it works" di halaman utama, menampilkan stepper visual modern dengan glassmorphism card.
- Awalnya menggunakan SVG (`wave-stepper.svg`) sebagai background stepper, namun terjadi masalah alignment antara label step dan visual stepper.
- Step label dan deskripsi di-overlay secara absolute agar presisi mengikuti posisi step pada SVG/PNG.
- Setelah beberapa iterasi, background stepper diganti ke PNG (`wave-steper2.png`) untuk kemudahan penyesuaian ukuran dan visual.
- Ukuran card mengikuti layout Footer: `width: calc(100vw - 100px)`, `max-width: 1400px`, margin auto, dan border-radius 24px.
- Tinggi card diatur agar proporsional dengan stepper (292px), dan gambar stepper diatur `object-fit: contain` agar tidak overflow.
- Overlay step label (Step 1, 2, 3) diposisikan absolute di atas PNG, dengan koordinat presisi sesuai visual stepper.
- Border card menggunakan efek glassmorphism: `border: 1.5px solid rgba(255,255,255,0.10)`.
- Semua style dan struktur sudah responsif, serta mengikuti best practice React + Tailwind + CSS Module.

## 8. Catatan Lain (Koreksi)
- Semua perubahan sudah mengikuti best practice React + Tailwind + CSS Module.
- Struktur frontend kini modular, scalable, dan siap untuk pengembangan section/page berikutnya.
