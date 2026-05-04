import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kamar & Harga | Penginapan Ron\'s Guest House Berastagi',
  description:
    'Pilih kamar terbaik di Ron\'s Guest House Berastagi — tersedia Standard, City View, Superior, dan Suite. Harga terjangkau, fasilitas lengkap, dekat wisata Gunung Sibayak dan Bukit Gundaling.',
  keywords: [
    'kamar hotel berastagi',
    'harga penginapan berastagi',
    'kamar murah berastagi',
    'standard room berastagi',
    'suite berastagi',
    'villa berastagi karo',
  ],
  openGraph: {
    title: 'Kamar & Akomodasi — Ron\'s Guest House Berastagi',
    description: 'Temukan kamar impian Anda di penginapan terbaik Berastagi.',
  },
  alternates: { canonical: '/rooms' },
};

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
