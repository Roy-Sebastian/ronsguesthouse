# Pengujian Keamanan Sistem — Ron's Guesthouse (Ringkas)
## Bukti Pemenuhan Kebutuhan Non-Fungsional

> **Kebutuhan:** Sistem harus mampu melindungi data dan akses pengguna melalui mekanisme autentikasi berbasis email dan kata sandi, penerapan RBAC untuk membatasi hak akses setiap pengguna sesuai perannya, serta pencatatan seluruh aktivitas melalui Audit Log guna mencegah akses tidak sah.

> **Tool:** Postman | **Base URL:** `https://api.ronsguesthouse.com/api`  
> **Nama Collection:** `Ron's Guesthouse — Uji Keamanan NF`

---

## Persiapan

1. Buka Postman → Buat Collection baru bernama **`Ron's Guesthouse — Uji Keamanan NF`**
2. Klik ikon **Cookies** di toolbar atas → tambahkan domain `api.ronsguesthouse.com`
   *(Postman akan otomatis menyimpan dan mengirim session cookie setiap request)*

---

## Pengujian 1 — Autentikasi Email & Kata Sandi

### Test 1a — Login dengan Kredensial Valid

```
POST https://api.ronsguesthouse.com/api/auth/sign-in/email
Body (raw JSON):
{
  "email": "superadmin@ronsguesthouse.com",
  "password": "password123"
}
```

| | |
|---|---|
| **Hasil Diharapkan** | `200 OK` + cookie `better-auth.session_token` tersimpan otomatis |
| **Makna** | Sistem berhasil mengautentikasi pengguna via email & kata sandi |

---

### Test 1b — Akses Endpoint Tanpa Login

> Hapus dulu cookie: klik **Cookies** → hapus `better-auth.session_token`

```
GET https://api.ronsguesthouse.com/api/users
(tanpa cookie / tanpa login)
```

| | |
|---|---|
| **Hasil Diharapkan** | `401 Unauthorized` |
| **Makna** | Sistem menolak semua akses yang tidak memiliki sesi aktif |

---

## Pengujian 2 — RBAC (Role-Based Access Control)

> **Cara berganti role:** Hapus cookie lama → Login ulang dengan akun role berbeda.

### Test 2a — Receptionist Mengakses Endpoint Terlarang

Login sebagai Receptionist:
```
POST https://api.ronsguesthouse.com/api/auth/sign-in/email
{ "email": "receptionist@ronsguesthouse.com", "password": "password123" }
```

Lalu akses:
```
GET https://api.ronsguesthouse.com/api/users
```

| | |
|---|---|
| **Hasil Diharapkan** | `403 Forbidden` |
| **Makna** | RBAC bekerja — Receptionist tidak memiliki izin `user.view` |

---

### Test 2b — Superadmin Mengakses Endpoint yang Sama

Hapus cookie → Login sebagai Superadmin → akses endpoint yang sama:
```
GET https://api.ronsguesthouse.com/api/users
```

| | |
|---|---|
| **Hasil Diharapkan** | `200 OK` + data daftar pengguna |
| **Makna** | Role berbeda mendapat hak akses berbeda sesuai RBAC |

---

## Pengujian 3 — Audit Log

> Login sebagai Superadmin (satu-satunya role yang dapat mengakses log).

### Test 3a — Audit Log Tersedia untuk Superadmin

```
GET https://api.ronsguesthouse.com/api/audit-logs
```

| | |
|---|---|
| **Hasil Diharapkan** | `200 OK` + array berisi riwayat aktivitas (action, userId, createdAt) |
| **Makna** | Sistem mencatat seluruh aktivitas pengguna secara otomatis |

---

### Test 3b — Receptionist Tidak Dapat Mengakses Audit Log

Hapus cookie → Login sebagai Receptionist → akses:
```
GET https://api.ronsguesthouse.com/api/audit-logs
```

| | |
|---|---|
| **Hasil Diharapkan** | `403 Forbidden` |
| **Makna** | Audit Log hanya bisa diakses Superadmin — mencegah akses tidak sah ke catatan sistem |

---

### Test 3c — Verifikasi Sistem Mencatat Aktivitas (Trigger → Verifikasi)

> Pola ini membuktikan bahwa sistem **benar-benar mencatat** aktivitas, bukan sekadar menyediakan endpoint log.

**Step 1 — Trigger aktivitas** (Login sebagai Superadmin, catat waktu pengujian):
```
POST https://api.ronsguesthouse.com/api/auth/sign-in/email
{ "email": "superadmin@ronsguesthouse.com", "password": "password123" }
```

**Step 2 — Lakukan aksi write yang memicu pencatatan log** (membuat fasilitas baru):
```
POST https://api.ronsguesthouse.com/api/facilities
Body (raw JSON):
{
  "name": "Fasilitas Uji Audit",
  "description": "Fasilitas untuk menguji pencatatan audit log"
}
```

**Step 3 — Verifikasi aktivitas tercatat di Audit Log**:
```
GET https://api.ronsguesthouse.com/api/audit-logs
```

| | |
|---|---|
| **Hasil Diharapkan** | `200 OK` + terdapat entry baru dengan `action`: `"CREATE"` dan `entity`: `"facilities"` |
| **Yang diverifikasi** | Field `action` bernilai `"CREATE"`, `entity` bernilai `"facilities"`, `userId` menunjuk ke akun Superadmin, dan payload `newValues` berisi data fasilitas yang dikirim di Step 2 |
| **Makna** | Sistem secara otomatis mencatat seluruh aktivitas modifikasi data pengguna ke dalam Audit Log sebagai bukti pencatatan aktivitas |

---

## Tabel Hasil Pengujian

| # | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|
| 1a | Login kredensial valid | `200 OK` + session cookie | | |
| 1b | Akses tanpa login | `401 Unauthorized` | | |
| 2a | Receptionist → GET `/users` | `403 Forbidden` | | |
| 2b | Superadmin → GET `/users` | `200 OK` | | |
| 3a | Superadmin → GET `/audit-logs` | `200 OK` + data log | | |
| 3b | Receptionist → GET `/audit-logs` | `403 Forbidden` | | |
| 3c | Verifikasi aktivitas tercatat (Trigger → Verifikasi) | Entry baru dengan `action`, `userId`, `createdAt` muncul di log | | |

---

## Kesimpulan

| Kebutuhan Non-Fungsional | Dibuktikan Melalui | Hasil |
|---|---|---|
| Autentikasi email & kata sandi | Test 1a & 1b | |
| RBAC — pembatasan hak akses per peran | Test 2a & 2b | |
| Audit Log — akses terbatas (hanya Superadmin) | Test 3a & 3b | |
| Audit Log — pencatatan seluruh aktivitas pengguna | Test 3c | |

> **Catatan:** Kolom *Hasil Aktual* dan *Status* (✅ Lulus / ❌ Gagal) diisi berdasarkan hasil pengujian nyata menggunakan Postman, disertai screenshot sebagai bukti.
