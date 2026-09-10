# Satrio Nugroho — Portfolio

Portfolio profesional Satrio Nugroho dengan visual editorial navy–off-white, dibangun memakai Next.js App Router. Halaman utama diprerender untuk SEO, lalu ditingkatkan di browser dengan navigasi responsif, pilihan bahasa EN/ID, motion berbasis scroll, dan form kontak `mailto`.

## Menjalankan project

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Pemeriksaan

```bash
npm test
npm run build
```

## Struktur utama

```text
app/
├── layout.js        # Metadata, social cards, dan Person JSON-LD
├── page.js          # Halaman server-rendered
├── _components/
│   └── portfolio.js # Interaksi client dan markup portofolio
├── globals.css      # Design system dan responsive styling
├── robots.js        # robots.txt
└── sitemap.js       # sitemap.xml
data/
└── portfolio-content.js # Konten EN/ID dan konfigurasi section
public/assets/        # Foto, logo, screenshot proyek, dan CV
```

File statis lama (`index.html`, `css/`, `js/`, dan `assets/`) tetap dipertahankan sebagai rollback selama masa migrasi.

## Deployment

Import repository ke Vercel atau jalankan `npm run build` dan `npm start` pada Node.js 20.9 atau lebih baru. Domain produksi yang digunakan metadata SEO adalah `https://satrionugroho.com`.
