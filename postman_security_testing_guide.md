# Panduan Pengujian Keamanan Sistem — Ron's Guesthouse
## Menggunakan Postman (Dari Awal)

> **Tujuan:** Membuktikan bahwa sistem memenuhi kebutuhan non-fungsional:
> 1. **Autentikasi** berbasis email & kata sandi
> 2. **RBAC** (Role-Based Access Control) — pembatasan hak akses per peran
> 3. **Audit Log** — pencatatan aktivitas untuk mencegah akses tidak sah

---

## BAGIAN A — PERSIAPAN POSTMAN (DARI NOL)

### A.1 — Unduh & Install Postman

1. Buka browser → pergi ke [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
2. Klik **Download** → Install seperti biasa
3. Buka Postman → Buat akun gratis (atau **Skip**)

---

### A.2 — Buat Collection Baru

1. Di sidebar kiri, klik **Collections** → klik tombol **+** (New Collection)
2. Beri nama: `Ron's Guesthouse — Security Testing`
3. Klik **Create**

---

### A.3 — Aktifkan Cookie Manager

> **Penting!** Backend menggunakan **session cookie** (Better Auth), bukan Bearer Token.

1. Di toolbar atas Postman, klik ikon **Cookies** (di sebelah kanan tombol Send)
2. Tambahkan domain: `api.ronsguesthouse.com`
3. Postman akan otomatis menyimpan & mengirim cookie setiap request ke domain tersebut

---

### A.4 — Buat 4 Environment

Klik ikon **⚙️ Environments** di sidebar kiri → **+** untuk setiap environment:

| Environment | Variabel | Nilai Awal |
|---|---|---|
| `ENV - No Auth` | *(kosong)* | *(tidak perlu)* |
| `ENV - Superadmin` | `base_url` | `https://api.ronsguesthouse.com/api` |
| `ENV - Admin` | `base_url` | `https://api.ronsguesthouse.com/api` |
| `ENV - Receptionist` | `base_url` | `https://api.ronsguesthouse.com/api` |

Cara membuat Environment:
1. Klik **Environments** (ikon 🌍 di sidebar kiri)
2. Klik **+** → Beri nama → Tambah variabel `base_url` → **Save**

---

## BAGIAN B — PENGUJIAN 1: AUTENTIKASI (EMAIL & PASSWORD)

> **Tujuan:** Membuktikan sistem hanya mengizinkan login dengan kredensial valid dan menolak akses tanpa autentikasi.

---

### 🔐 TC-AUTH-01 — Login dengan Kredensial Valid

**Langkah:**
1. Dalam Collection, klik kanan → **Add Request**
2. Beri nama: `[AUTH-01] Login Valid - Superadmin`
3. Set method: **POST**
4. URL: `https://api.ronsguesthouse.com/api/auth/sign-in/email`
5. Klik tab **Body** → pilih **raw** → pilih format **JSON**
6. Isi body:
```json
{
  "email": "superadmin@ronsguesthouse.com",
  "password": "password123"
}
```
7. Klik **Send**

**Hasil yang Diharapkan:**
- Status: `200 OK`
- Response body berisi data user & session
- Di header response ada `Set-Cookie: better-auth.session_token=...`
- Postman otomatis menyimpan cookie ini

**Screenshot yang perlu dicatat:** Status 200, response body, dan cookie yang tersimpan

---

### 🔐 TC-AUTH-02 — Login dengan Password Salah

**Langkah:**
1. Duplikat request sebelumnya → Rename: `[AUTH-02] Login Password Salah`
2. Ganti body:
```json
{
  "email": "superadmin@ronsguesthouse.com",
  "password": "passwordSalah999"
}
```
3. Klik **Send**

**Hasil yang Diharapkan:**
- Status: `401 Unauthorized` atau `400 Bad Request`
- Response berisi pesan error
- **Tidak ada cookie** yang tersimpan

---

### 🔐 TC-AUTH-03 — Login dengan Email Tidak Terdaftar

1. Duplikat → Rename: `[AUTH-03] Login Email Tidak Terdaftar`
2. Ganti body:
```json
{
  "email": "tidakterdaftar@example.com",
  "password": "apapun123"
}
```
3. Klik **Send**

**Hasil yang Diharapkan:**
- Status: `401 Unauthorized` atau `400 Bad Request`

---

### 🔐 TC-AUTH-04 — Akses Endpoint Tanpa Login (Unauthenticated)

**Langkah:**
1. Buat request baru: `[AUTH-04] Akses Tanpa Login`
2. Pastikan environment yang aktif adalah `ENV - No Auth`
3. Di Postman, hapus semua cookie dulu:
   - Klik **Cookies** → `api.ronsguesthouse.com` → Hapus semua cookie
4. Method: **GET**
5. URL: `https://api.ronsguesthouse.com/api/users`
6. Klik **Send** (tanpa cookie / tanpa login)

**Hasil yang Diharapkan:**
```json
{ "error": "Unauthorized" }
```
- Status: `401 Unauthorized`
- Membuktikan: sistem **menolak akses tanpa autentikasi**

---

### 🔐 TC-AUTH-05 — Logout & Verifikasi Session Hangus

**Langkah:**
1. Login dulu sebagai Superadmin (TC-AUTH-01)
2. Buat request: `[AUTH-05] Logout`
   - Method: **POST**
   - URL: `https://api.ronsguesthouse.com/api/auth/sign-out`
   - Klik **Send** → Status `200 OK`
3. Setelah logout, langsung akses endpoint:
   - Method: **GET**
   - URL: `https://api.ronsguesthouse.com/api/users`
   - Klik **Send**

**Hasil yang Diharapkan:**
- Setelah logout, request ke `/api/users` harus return `401 Unauthorized`
- Membuktikan: **session langsung tidak valid setelah logout**

---

## BAGIAN C — PENGUJIAN 2: RBAC (ROLE-BASED ACCESS CONTROL)

> **Tujuan:** Membuktikan setiap role hanya bisa mengakses endpoint sesuai haknya.

### Cara Berganti Role di Postman:
1. Hapus cookie lama: klik **Cookies** → hapus `better-auth.session_token`
2. Login ulang dengan akun role yang ingin diuji
3. Jalankan request pengujian

---

### 🟡 TC-RBAC-01 — Receptionist Akses Endpoint Terlarang

**Setup:** Login sebagai akun Receptionist terlebih dahulu.

**Login Receptionist:**
```
POST https://api.ronsguesthouse.com/api/auth/sign-in/email
{
  "email": "receptionist@ronsguesthouse.com",
  "password": "password123"
}
```

Setelah login, jalankan request berikut satu per satu:

| # | Nama Request | Method | URL | Hasil yang Diharapkan |
|---|---|---|---|---|
| 1 | `[RBAC-01a] Receptionist → GET Users` | GET | `/api/users` | `403 Forbidden` ❌ |
| 2 | `[RBAC-01b] Receptionist → POST Users` | POST | `/api/users` | `403 Forbidden` ❌ |
| 3 | `[RBAC-01c] Receptionist → GET Audit Log` | GET | `/api/audit-logs` | `403 Forbidden` ❌ |
| 4 | `[RBAC-01d] Receptionist → GET Expenses` | GET | `/api/expenses` | `403 Forbidden` ❌ |
| 5 | `[RBAC-01e] Receptionist → GET Rooms` | GET | `/api/rooms` | `403 Forbidden` ❌ |
| 6 | `[RBAC-01f] Receptionist → GET Guests` | GET | `/api/guests` | `200 OK` ✅ |
| 7 | `[RBAC-01g] Receptionist → GET Reservations` | GET | `/api/reservations` | `200 OK` ✅ |

**Expected Response (403):**
```json
{ "error": "Forbidden" }
```

---

### 🟠 TC-RBAC-02 — Admin Akses Endpoint Superadmin-Only

**Setup:** Hapus cookie → Login sebagai Admin.

**Login Admin:**
```
POST https://api.ronsguesthouse.com/api/auth/sign-in/email
{
  "email": "admin@ronsguesthouse.com",
  "password": "password123"
}
```

| # | Nama Request | Method | URL | Hasil yang Diharapkan |
|---|---|---|---|---|
| 1 | `[RBAC-02a] Admin → GET Users` | GET | `/api/users` | `403 Forbidden` ❌ |
| 2 | `[RBAC-02b] Admin → POST Users` | POST | `/api/users` | `403 Forbidden` ❌ |
| 3 | `[RBAC-02c] Admin → DELETE Users` | DELETE | `/api/users/99` | `403 Forbidden` ❌ |
| 4 | `[RBAC-02d] Admin → GET Audit Log` | GET | `/api/audit-logs` | `403 Forbidden` ❌ |
| 5 | `[RBAC-02e] Admin → GET Expenses` | GET | `/api/expenses` | `200 OK` ✅ |
| 6 | `[RBAC-02f] Admin → GET Rooms` | GET | `/api/rooms` | `200 OK` ✅ |
| 7 | `[RBAC-02g] Admin → GET Guests` | GET | `/api/guests` | `200 OK` ✅ |

---

### 🟢 TC-RBAC-03 — Superadmin Akses Semua Endpoint

**Setup:** Hapus cookie → Login sebagai Superadmin.

| # | Nama Request | Method | URL | Hasil yang Diharapkan |
|---|---|---|---|---|
| 1 | `[RBAC-03a] Superadmin → GET Users` | GET | `/api/users` | `200 OK` ✅ |
| 2 | `[RBAC-03b] Superadmin → GET Audit Log` | GET | `/api/audit-logs` | `200 OK` ✅ |
| 3 | `[RBAC-03c] Superadmin → GET Expenses` | GET | `/api/expenses` | `200 OK` ✅ |
| 4 | `[RBAC-03d] Superadmin → GET Rooms` | GET | `/api/rooms` | `200 OK` ✅ |
| 5 | `[RBAC-03e] Superadmin → GET Guests` | GET | `/api/guests` | `200 OK` ✅ |
| 6 | `[RBAC-03f] Superadmin → GET Reservations` | GET | `/api/reservations` | `200 OK` ✅ |

---

### 🔵 TC-RBAC-04 — Akun Dinonaktifkan (isActive: false)

**Setup:**
1. Login sebagai Superadmin
2. Buka dashboard → Manajemen Pengguna → Nonaktifkan salah satu akun (misal: Admin)
3. Logout dari Superadmin
4. Coba login sebagai akun yang dinonaktifkan

**Request Login Akun Nonaktif:**
```
POST https://api.ronsguesthouse.com/api/auth/sign-in/email
{
  "email": "admin@ronsguesthouse.com",
  "password": "password123"
}
```
Jika login berhasil (200), coba akses:
```
GET https://api.ronsguesthouse.com/api/guests
```

**Hasil yang Diharapkan:**
```json
{ "error": "Account is inactive" }
```
- Status: `403 Forbidden`

---

## BAGIAN D — PENGUJIAN 3: AUDIT LOG

> **Tujuan:** Membuktikan bahwa setiap aktivitas pengguna tercatat di sistem untuk mencegah akses tidak sah.

### 🗂️ TC-AUDIT-01 — Verifikasi Audit Log Tercatat

**Setup:** Login sebagai Superadmin.

**Langkah:**

**Step 1:** Lakukan aksi yang seharusnya terekam (misal: buat data tamu baru)
```
POST https://api.ronsguesthouse.com/api/guests
Content-Type: application/json

{
  "name": "Test Audit Log",
  "phone": "08123456789",
  "address": "Jl. Test No. 1"
}
```
→ Catat ID yang dikembalikan (misal: `id: 99`)

**Step 2:** Buka Audit Log
```
GET https://api.ronsguesthouse.com/api/audit-logs
```

**Hasil yang Diharapkan:**
- Status: `200 OK`
- Dalam response array, terdapat entri baru yang mencatat:
  - `action`: `CREATE` atau `guest.create`
  - `userId`: ID user yang melakukan aksi
  - `createdAt`: timestamp aksi
  - `details` / `description`: informasi aksi yang dilakukan

---

### 🗂️ TC-AUDIT-02 — Verifikasi Aksi Edit Terekam

**Step 1:** Edit data guest yang tadi dibuat
```
PATCH https://api.ronsguesthouse.com/api/guests/99
Content-Type: application/json

{
  "name": "Test Audit Log - EDITED"
}
```

**Step 2:** Cek Audit Log lagi
```
GET https://api.ronsguesthouse.com/api/audit-logs
```

**Hasil yang Diharapkan:**
- Ada entri baru dengan `action: UPDATE`
- Mencantumkan siapa yang mengedit dan kapan

---

### 🗂️ TC-AUDIT-03 — Verifikasi Aksi Delete Terekam

**Step 1:** Hapus data guest
```
DELETE https://api.ronsguesthouse.com/api/guests/99
```

**Step 2:** Cek Audit Log
```
GET https://api.ronsguesthouse.com/api/audit-logs
```

**Hasil yang Diharapkan:**
- Ada entri baru dengan `action: DELETE`
- Sistem mencatat bahwa data telah dihapus beserta siapa yang melakukannya

---

### 🗂️ TC-AUDIT-04 — Receptionist Tidak Bisa Lihat Audit Log

**Setup:** Hapus cookie → Login sebagai Receptionist.

```
GET https://api.ronsguesthouse.com/api/audit-logs
```

**Hasil yang Diharapkan:**
- Status: `403 Forbidden`
- Membuktikan: **hanya Superadmin yang bisa melihat Audit Log**

---

## BAGIAN E — MENGGUNAKAN COLLECTION RUNNER (Otomatis)

> Jalankan semua test sekaligus dan ekspor hasilnya sebagai laporan.

### Langkah-Langkah:

1. **Klik kanan** pada Collection `Ron's Guesthouse — Security Testing`
2. Pilih **Run Collection**
3. Muncul jendela **Collection Runner**
4. Pastikan semua request tercentang
5. Klik tombol **Run Ron's Guesthouse — Security Testing**
6. Tunggu hingga semua request selesai
7. Lihat hasil: ✅ **Pass** / ❌ **Fail** per request

### Ekspor Hasil sebagai Laporan:

1. Setelah Runner selesai, klik tombol **Export Results**
2. Simpan file JSON hasil → bisa dilampirkan di laporan Tugas Akhir
3. Atau klik **View Summary** untuk melihat ringkasan visual

---

## BAGIAN F — TABEL RINGKASAN HASIL PENGUJIAN

> Isi kolom **Hasil Aktual** dan **Status** berdasarkan pengujian yang dilakukan.

### F.1 — Autentikasi

| Kode TC | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|
| TC-AUTH-01 | Login kredensial valid | `200 OK` + Session Cookie | | |
| TC-AUTH-02 | Login password salah | `401 Unauthorized` | | |
| TC-AUTH-03 | Login email tidak terdaftar | `401 Unauthorized` | | |
| TC-AUTH-04 | Akses endpoint tanpa login | `401 Unauthorized` | | |
| TC-AUTH-05 | Akses setelah logout | `401 Unauthorized` | | |

### F.2 — RBAC

| Kode TC | Skenario | Role | Endpoint | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|
| TC-RBAC-01a | Akses terlarang | Receptionist | GET `/users` | `403 Forbidden` | | |
| TC-RBAC-01c | Akses terlarang | Receptionist | GET `/audit-logs` | `403 Forbidden` | | |
| TC-RBAC-01f | Akses diizinkan | Receptionist | GET `/guests` | `200 OK` | | |
| TC-RBAC-02a | Akses terlarang | Admin | GET `/users` | `403 Forbidden` | | |
| TC-RBAC-02d | Akses terlarang | Admin | GET `/audit-logs` | `403 Forbidden` | | |
| TC-RBAC-02e | Akses diizinkan | Admin | GET `/expenses` | `200 OK` | | |
| TC-RBAC-03a | Akses semua | Superadmin | GET `/users` | `200 OK` | | |
| TC-RBAC-03b | Akses semua | Superadmin | GET `/audit-logs` | `200 OK` | | |
| TC-RBAC-04 | Akun nonaktif | Admin (inactive) | GET `/guests` | `403 Inactive` | | |

### F.3 — Audit Log

| Kode TC | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|
| TC-AUDIT-01 | Aksi CREATE terekam | Entri log action=CREATE muncul | | |
| TC-AUDIT-02 | Aksi UPDATE terekam | Entri log action=UPDATE muncul | | |
| TC-AUDIT-03 | Aksi DELETE terekam | Entri log action=DELETE muncul | | |
| TC-AUDIT-04 | Receptionist ditolak | `403 Forbidden` | | |

---

## BAGIAN G — MATRIKS IZIN LENGKAP

| Endpoint | Permission | Superadmin | Admin | Receptionist | Unauthenticated |
|---|---|:---:|:---:|:---:|:---:|
| GET `/users` | `user.view` | ✅ | ❌ 403 | ❌ 403 | ❌ 401 |
| POST `/users` | `user.create` | ✅ | ❌ 403 | ❌ 403 | ❌ 401 |
| PATCH `/users/{id}` | `user.edit` | ✅ | ❌ 403 | ❌ 403 | ❌ 401 |
| DELETE `/users/{id}` | `user.delete` | ✅ | ❌ 403 | ❌ 403 | ❌ 401 |
| GET `/audit-logs` | `audit.view` | ✅ | ❌ 403 | ❌ 403 | ❌ 401 |
| GET `/expenses` | `expense.view` | ✅ | ✅ | ❌ 403 | ❌ 401 |
| POST `/expenses` | `expense.create` | ✅ | ✅ | ❌ 403 | ❌ 401 |
| GET `/rooms` | `room.view` | ✅ | ✅ | ❌ 403 | ❌ 401 |
| GET `/guests` | `guest.view` | ✅ | ✅ | ✅ | ❌ 401 |
| GET `/reservations` | `reservation.view` | ✅ | ✅ | ✅ | ❌ 401 |
| GET `/incomes` | `income.view` | ✅ | ✅ | ✅ | ❌ 401 |
| DELETE `/guests/{id}` | `guest.delete` | ✅ | ❌ 403 | ❌ 403 | ❌ 401 |

---

## BAGIAN H — KETERKAITAN DENGAN KEBUTUHAN NON-FUNGSIONAL

| Kebutuhan Non-Fungsional | Dibuktikan Melalui | Test Case |
|---|---|---|
| **Autentikasi** email & password | Login valid → `200 OK`; login salah → `401` | TC-AUTH-01, 02, 03 |
| **Session management** | Session hangus setelah logout | TC-AUTH-05 |
| **RBAC** — pembatasan per peran | Role berbeda mendapat respons berbeda (200 vs 403) | TC-RBAC-01 s/d 04 |
| **Proteksi akun** | Akun nonaktif tidak bisa akses sistem | TC-RBAC-04 |
| **Audit Log** — pencatatan aktivitas | Setiap CRUD terekam di `/api/audit-logs` | TC-AUDIT-01, 02, 03 |
| **Audit Log** — akses terbatas | Hanya Superadmin yang bisa baca log | TC-AUDIT-04 |
| **Mencegah akses tidak sah** | Endpoint diproteksi: `401` tanpa auth, `403` tanpa izin | TC-AUTH-04, TC-RBAC-01 |

---

> [!IMPORTANT]
> Isi kolom **Hasil Aktual** dan **Status** (✅ Lulus / ❌ Gagal) di Bagian F setelah melakukan pengujian. Tabel tersebut bisa langsung dilampirkan sebagai bukti pengujian di laporan Tugas Akhir.

> [!TIP]
> Gunakan **Collection Runner** (Bagian E) untuk menjalankan semua request sekaligus. Ekspor hasilnya ke JSON/HTML untuk dilampirkan di laporan sebagai bukti pengujian otomatis.

> [!NOTE]
> **Base URL:** `https://api.ronsguesthouse.com/api`  
> **Auth Endpoint:** `https://api.ronsguesthouse.com/api/auth/sign-in/email`  
> **Logout Endpoint:** `https://api.ronsguesthouse.com/api/auth/sign-out`
