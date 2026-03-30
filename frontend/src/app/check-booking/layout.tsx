import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cek Booking | Ron\'s Guest House Berastagi',
  description:
    'Cek status pemesanan kamar Anda di Ron\'s Guest House Berastagi. Masukkan email dan kode booking untuk melacak reservasi Anda.',
  alternates: { canonical: '/check-booking' },
  robots: { index: false },
};

export default function CheckBookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
