// Kode 4.13 - Potongan Kode Validasi Webhook Pembayaran
// File: backend/src/services/midtrans.service.ts

import crypto from 'crypto';

export async function processMidtransNotification(body: MidtransNotificationBody) {
  const { order_id, transaction_status, gross_amount, signature_key, status_code } = body;
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

  // 1. Hitung signature yang diharapkan menggunakan SHA-512
  const hash = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');

  // 2. Bandingkan menggunakan constant-time comparison untuk mencegah timing attack
  const hashBuf = Buffer.from(hash);
  const sigBuf  = Buffer.from(signature_key);
  const signatureValid =
    hashBuf.length === sigBuf.length &&
    crypto.timingSafeEqual(hashBuf, sigBuf);

  if (!signatureValid) {
    throw Object.assign(new Error('Invalid signature'), { statusCode: 400 });
  }

  // 3. Idempotency check — abaikan duplikat webhook
  if (transaction.paymentStatus === 'paid' || transaction.paymentStatus === 'refunded') {
    return; // Sudah diproses sebelumnya
  }

  // 4. Penanganan pembayaran terlambat (reservasi sudah expired)
  if (internalStatus === 'paid') {
    if (reservation.status === ReservationStatus.expired || reservation.status === ReservationStatus.cancelled) {
      await transactionRepository.update(transaction.id, {
        data: { paymentStatus: 'refunded', notes: 'Payment received after expiry' },
      });
      return;
    }
    // ... konfirmasi reservasi dan buat income record
  }
}
