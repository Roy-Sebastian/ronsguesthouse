# Panduan Pengujian RBAC Non-Fungsional — Keamanan API Ron's Guesthouse

> **Base URL:** `https://api.ronsguesthouse.com/api`  
> **Auth endpoint:** `https://api.ronsguesthouse.com/api/auth/sign-in/email`

---

## Langkah 0 — Setup Postman

Buat **3 Environment** di Postman:
- `Superadmin Env` → variabel `token` (diisi setelah login)
- `Admin Env` → variabel `token`
- `Receptionist Env` → variabel `token`

Gunakan **Cookie** (bukan Bearer Token) karena backend menggunakan Better Auth session via cookie.

---

## Langkah 1 — Login untuk Masing-Masing Role

Lakukan request ini untuk setiap akun, lalu Postman otomatis menyimpan cookie sesi.

### POST Login
```
POST https://api.ronsguesthouse.com/api/auth/sign-in/email
Content-Type: application/json
```
```json
{
  "email": "superadmin@example.com",
  "password": "passwordmu"
}
```
> ✅ **Expected:** `200 OK` + Set-Cookie header (Postman otomatis simpan cookie)  
> Ulangi untuk akun `admin` dan `receptionist`.

---

## Skenario Pengujian RBAC

### 🔴 TC-RBAC-01 — Tanpa Login (Unauthenticated)
**Tujuan:** Akses endpoint tanpa session → harus ditolak

| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 1 | GET | `/api/users` | `401 Unauthorized` |
| 2 | GET | `/api/audit-logs` | `401 Unauthorized` |
| 3 | GET | `/api/guests` | `401 Unauthorized` |

**Cara:** Buat request **tanpa cookie/token** apapun.

**Expected Response:**
```json
{ "error": "Unauthorized" }
```

---

### 🟡 TC-RBAC-02 — Receptionist Mengakses Endpoint Terlarang
**Tujuan:** Role `receptionist` tidak boleh akses manajemen pengguna, audit log, dan laporan keuangan

| # | Method | Endpoint | Permission Dibutuhkan | Expected |
|---|--------|----------|-----------------------|----------|
| 1 | GET | `/api/users` | `user.view` | `403 Forbidden` |
| 2 | POST | `/api/users` | `user.create` | `403 Forbidden` |
| 3 | GET | `/api/audit-logs` | `audit.view` | `403 Forbidden` |
| 4 | GET | `/api/expenses` | `expense.view` | `403 Forbidden` |
| 5 | GET | `/api/rooms` | `room.view` | `403 Forbidden` |
| 6 | DELETE | `/api/guests/{id}` | `guest.delete` | `403 Forbidden` |
| 7 | GET | `/api/incomes` | `income.view` | `200 OK` ✅ (receptionist boleh) |
| 8 | GET | `/api/reservations` | `reservation.view` | `200 OK` ✅ (receptionist boleh) |

**Expected Response (403):**
```json
{ "error": "Forbidden" }
```

---

### 🟠 TC-RBAC-03 — Admin Mengakses Endpoint Superadmin-Only
**Tujuan:** Role `admin` tidak boleh akses manajemen pengguna & audit log

| # | Method | Endpoint | Permission Dibutuhkan | Expected |
|---|--------|----------|-----------------------|----------|
| 1 | GET | `/api/users` | `user.view` | `403 Forbidden` |
| 2 | POST | `/api/users` | `user.create` | `403 Forbidden` |
| 3 | PATCH | `/api/users/{id}` | `user.edit` | `403 Forbidden` |
| 4 | DELETE | `/api/users/{id}` | `user.delete` | `403 Forbidden` |
| 5 | GET | `/api/audit-logs` | `audit.view` | `403 Forbidden` |
| 6 | GET | `/api/expenses` | `expense.view` | `200 OK` ✅ (admin boleh) |
| 7 | GET | `/api/rooms` | `room.view` | `200 OK` ✅ (admin boleh) |

**Expected Response (403):**
```json
{ "error": "Forbidden" }
```

---

### 🟢 TC-RBAC-04 — Superadmin Akses Semua Endpoint
**Tujuan:** Role `superadmin` bisa akses semua endpoint

| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 1 | GET | `/api/users` | `200 OK` |
| 2 | GET | `/api/audit-logs` | `200 OK` |
| 3 | GET | `/api/expenses` | `200 OK` |
| 4 | GET | `/api/rooms` | `200 OK` |
| 5 | GET | `/api/guests` | `200 OK` |
| 6 | GET | `/api/reservations` | `200 OK` |

---

### 🔵 TC-RBAC-05 — User Nonaktif (isActive: false)
**Tujuan:** Akun yang dinonaktifkan tidak bisa login/mengakses API

> **Setup:** Nonaktifkan salah satu akun via toggle di dashboard superadmin.

| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 1 | POST | `/api/auth/sign-in/email` | `200 OK` (login masih bisa) |
| 2 | GET | `/api/guests` (dengan session akun nonaktif) | `403 Account is inactive` |

**Expected Response:**
```json
{ "error": "Account is inactive" }
```

---

### 🔵 TC-RBAC-06 — Akun Tidak Login Akses Endpoint Admin
**Tujuan:** Endpoint yang memerlukan auth harus return 401, bukan 200

| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 1 | GET | `/api/dashboard` | `401 Unauthorized` |
| 2 | POST | `/api/expenses` | `401 Unauthorized` |
| 3 | DELETE | `/api/rooms/{id}` | `401 Unauthorized` |

---

## Cara Pengujian di Postman — Step by Step

### Step 1: Login
```
POST https://api.ronsguesthouse.com/api/auth/sign-in/email
Body (raw JSON):
{
  "email": "receptionist@ronsguesthouse.com",
  "password": "password123"
}
```
→ Postman otomatis simpan session cookie `better-auth.session_token`

### Step 2: Test Endpoint Terlarang (sebagai Receptionist)
```
GET https://api.ronsguesthouse.com/api/users
```
→ Harus return `403 Forbidden`

### Step 3: Test Endpoint yang Diizinkan (sebagai Receptionist)  
```
GET https://api.ronsguesthouse.com/api/guests
```
→ Harus return `200 OK` dengan data tamu

### Step 4: Logout (opsional, untuk uji ulang)
```
POST https://api.ronsguesthouse.com/api/auth/sign-out
```

---

## Tabel Matriks Izin Lengkap

| Endpoint | Permission | Superadmin | Admin | Receptionist |
|----------|-----------|:----------:|:-----:|:------------:|
| GET `/users` | `user.view` | ✅ | ❌ | ❌ |
| POST `/users` | `user.create` | ✅ | ❌ | ❌ |
| GET `/audit-logs` | `audit.view` | ✅ | ❌ | ❌ |
| GET `/expenses` | `expense.view` | ✅ | ✅ | ❌ |
| GET `/rooms` | `room.view` | ✅ | ✅ | ❌ |
| GET `/guests` | `guest.view` | ✅ | ✅ | ✅ |
| GET `/reservations` | `reservation.view` | ✅ | ✅ | ✅ |
| GET `/incomes` | `income.view` | ✅ | ✅ | ✅ |
| DELETE `/guests/{id}` | `guest.delete` | ✅ | ❌ | ❌ |
| DELETE `/transactions/{id}` | `transaction.delete` | ✅ | ❌ | ❌ |

---

## HTTP Status Code yang Diharapkan

| Kode | Artinya | Kapan Muncul |
|------|---------|--------------|
| `200 OK` | Berhasil | Role memiliki permission |
| `201 Created` | Data berhasil dibuat | POST dengan permission valid |
| `401 Unauthorized` | Tidak ada sesi | Request tanpa login |
| `403 Forbidden` | Akses ditolak | Login tapi tidak punya permission |
| `403 Account is inactive` | Akun dinonaktifkan | Akun `isActive: false` |

---

> [!IMPORTANT]
> Pastikan backend sudah sync (`data/roles.json` tidak override default). Jika ada file `roles.json` di folder `backend/data/`, hapus dulu agar menggunakan default matrix yang sudah diperbaiki.

> [!TIP]
> Gunakan fitur **Collection Runner** di Postman untuk menjalankan semua skenario sekaligus secara otomatis dan mengekspor hasilnya sebagai laporan.
