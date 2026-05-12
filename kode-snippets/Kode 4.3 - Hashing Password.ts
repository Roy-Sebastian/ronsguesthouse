// Kode 4.3 - Potongan Kode Hashing Password
// File: backend/src/config/auth.ts
//
// BetterAuth menangani hashing password secara otomatis menggunakan
// algoritma Argon2id (memory-hard, resistant terhadap brute-force).
// Password TIDAK pernah disimpan dalam bentuk plaintext.
//
// Konfigurasi email/password di auth.ts mengaktifkan fitur ini:

export const auth = betterAuth({
  // ...
  emailAndPassword: {
    enabled: true,               // Aktifkan login email + password
    requireEmailVerification: false,
    // BetterAuth secara internal menggunakan Argon2id untuk hashing:
    //   - memory: 65536 KB
    //   - iterations: 3
    //   - parallelism: 4
    // Hashing terjadi otomatis saat user.create() dipanggil.
  },
  // ...
});

// Verifikasi password dilakukan oleh BetterAuth saat POST /api/auth/sign-in/email
// menggunakan constant-time comparison untuk mencegah timing attack.
