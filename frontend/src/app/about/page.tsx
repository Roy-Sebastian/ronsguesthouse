import type { Metadata } from "next";
import PublicFooter from "@/components/layout/PublicFooter";
import PublicNavbar from "@/components/layout/PublicNavbar";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata: Metadata = {
  title: "Tentang Kami | Penginapan & Hotel Berastagi",
  description:
    "Kenali lebih dekat Ron's Guest House, penginapan terbaik di Berastagi, Kabupaten Karo, Sumatera Utara. Strategis dekat Gunung Sibayak, Bukit Gundaling, dan Pasar Buah Berastagi.",
  keywords: [
    "tentang ron's guest house",
    "penginapan berastagi",
    "hotel berastagi karo",
    "wisata berastagi menginap",
  ],
  openGraph: {
    title: "Tentang Kami — Ron's Guest House Berastagi",
    description:
      "Penginapan nyaman dan terjangkau di jantung kota Berastagi. Dekat destinasi wisata utama Sumatera Utara.",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-red-900 selection:text-white">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-white text-gray-900 pt-32 pb-20 px-4 border-b border-gray-100">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">About Us</h1>
            <div className="w-16 h-0.5 bg-red-800 mx-auto mb-6" />
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              Welcome to Ron's Guest House, your elegant retreat situated in the heart of Berastagi.
              We offer a perfect blend of modern comfort and traditional warmth.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* 2. Profile Section: Image Left, Text Right */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Image Placeholder */}
            <div className="bg-gray-200 aspect-[4/3] rounded-sm relative overflow-hidden shadow-xl">
              <img
                src="/hotel.jpeg"
                alt="Ron's Guest House Berastagi - Kamar dan penginapan nyaman"
                className="w-full h-full object-cover opacity-90 grayscale-[20%]"
              />
            </div>
            {/* Text block */}
            <div className="flex flex-col justify-center h-full pt-4">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 font-sans">Profile</h2>
              <div className="space-y-6 text-gray-600 font-medium text-base md:text-lg leading-relaxed">
                <p>Ron's Guest House is Berastagi's best-value accommodation affordable, clean, and genuinely comfortable. We believe that a modest price should never mean a compromise in quality.</p>
                <p>Every room is designed with simplicity and function in mind: a comfortable bed, a spotless bathroom, and a calm atmosphere where you can truly unwind after a day of exploring.</p>
                <p>Our friendly staff is always on hand to assist whether it's a local attraction recommendation or anything you need during your stay. Your comfort and satisfaction are our top priority.</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 3. Our Story Section: Text Left, Image Right */}
      <section className="py-16 px-6 max-w-7xl mx-auto mb-10">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Text block */}
            <div className="flex flex-col justify-center h-full pt-4 order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 font-sans">Prime Location</h2>
              <div className="space-y-6 text-gray-600 font-medium text-base md:text-lg leading-relaxed">
                <p>Nestled in the heart of Berastagi town, Ron's Guest House is the perfect base for exploring the beauty of the Karo highlands without straying far from the city center.</p>
                <p>Just minutes from our doorstep, you can breathe in the crisp mountain air at the foot of Mount Sibayak, stroll through the flower gardens of Bukit Gundaling, or pick up fresh tropical fruits at the Berastagi Market.</p>
                <p>With easy access to all major attractions, Ron's Guest House is the smart choice saving you time, cutting costs, and keeping you comfortable throughout your journey.</p>
              </div>
            </div>
            {/* Image Placeholder */}
            <div className="bg-gray-200 aspect-[4/3] rounded-sm relative overflow-hidden shadow-sm order-1 lg:order-2 shadow-xl">
              <img
                src="/Sibayak.jpg"
                alt="Suasana penginapan Ron's Guest House di Berastagi Karo"
                className="w-full h-full object-cover opacity-90 grayscale-[20%]"
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 4. Discover Berastagi Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-gray-100 mt-8">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 text-center mb-16 font-sans">
            Discover Berastagi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { src: '/view.jpeg', alt: 'Panorama Berastagi', title: 'Panorama Berastagi', sub: 'City views from the highlands' },
              { src: '/waterfall.jpeg', alt: 'Sikulikap Waterfall Berastagi', title: 'Sikulikap Waterfall', sub: 'Refreshing mountain nature escape' },
              { src: '/sinabung.jpeg', alt: 'Mount Sinabung Berastagi', title: 'Mount Sinabung', sub: 'The grandeur of an active volcano' },
              { src: '/taman-alam-lumbini.jpg', alt: 'Taman Alam Lumbini Berastagi', title: 'Taman Alam Lumbini', sub: 'Grand pagoda amid Berastagi nature' },
            ].map(({ src, alt, title, sub }) => (
              <div key={title} className="bg-gray-400 aspect-[3/4] relative rounded-sm overflow-hidden group shadow-md cursor-pointer">
                <img src={src} alt={alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="text-white font-black text-lg mb-1">{title}</h3>
                  <p className="text-gray-300 text-sm font-medium">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <PublicFooter />
    </div>
  );
}
