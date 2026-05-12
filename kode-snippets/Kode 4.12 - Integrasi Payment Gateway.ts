// Kode 4.12 - Potongan Kode Integrasi Payment Gateway
// File: backend/src/services/midtrans.service.ts

import MidtransClient from 'midtrans-client';

const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const snap = new MidtransClient.Snap({
  isProduction: IS_PRODUCTION,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
});

export interface SnapTokenInput {
  reservationId: string;
  orderId: string;
  grossAmount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export async function createSnapToken(input: SnapTokenInput) {
  const parameter = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: Math.round(input.grossAmount),
    },
    credit_card: {
      secure: true, // Aktifkan 3D Secure
    },
    customer_details: {
      first_name: input.customerName || 'Guest',
      email: input.customerEmail || undefined,
      phone: input.customerPhone || undefined,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return { token: transaction.token, redirect_url: transaction.redirect_url };
}
