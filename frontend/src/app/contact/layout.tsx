import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontak Kami | Ron\'s Guest House Berastagi',
  description:
    'Hubungi Ron\'s Guest House — penginapan di Berastagi, Sumatera Utara. Tanyakan ketersediaan kamar, reservasi, atau informasi wisata Berastagi.',
  keywords: ['kontak penginapan berastagi', 'reservasi hotel berastagi', 'nomor telepon hotel berastagi'],
  openGraph: {
    title: 'Kontak — Ron\'s Guest House Berastagi',
    description: 'Hubungi kami untuk reservasi dan informasi penginapan di Berastagi.',
  },
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
