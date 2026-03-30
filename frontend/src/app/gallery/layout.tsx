import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galeri Foto | Penginapan Ron\'s Guest House Berastagi',
  description:
    'Lihat galeri foto kamar, fasilitas, dan suasana Ron\'s Guest House — penginapan terbaik di Berastagi, Kabupaten Karo, Sumatera Utara.',
  keywords: [
    'foto penginapan berastagi',
    'galeri hotel berastagi',
    'kamar penginapan berastagi',
    'fasilitas hotel berastagi',
  ],
  openGraph: {
    title: 'Galeri — Ron\'s Guest House Berastagi',
    description: 'Foto kamar, fasilitas, dan suasana penginapan nyaman di Berastagi.',
  },
  alternates: { canonical: '/gallery' },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
