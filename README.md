# OGGYKUN
# OGGYKUN website rebuild

Versi rebuild frontend berdasarkan struktur HTML yang tersisa.

## Isi
- `index.html` — halaman utama
- `style.css` — desain responsif
- `app.js` — daftar project, simpan konfigurasi ke localStorage, emoji, log, dan simulasi countdown

## Cara menjalankan
1. Ekstrak ZIP.
2. Buka `index.html` di browser untuk mencoba demo lokal.
3. Untuk memasang di hosting, unggah ketiga file (`index.html`, `style.css`, `app.js`) ke folder publik hosting.

## Batasan penting
Versi ini hanya demo frontend lokal. Ia tidak meminta atau menyimpan Discord Auth Token, dan tidak mengirim pesan ke Discord. Untuk integrasi sungguhan, gunakan bot resmi Discord dengan izin yang sesuai, OAuth2 bila dibutuhkan, dan backend yang menjaga token bot sebagai rahasia. Jangan letakkan token rahasia di JavaScript browser.
