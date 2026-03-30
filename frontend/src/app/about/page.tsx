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
      <section className="bg-black text-white pt-32 pb-20 px-4">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">About Us</h1>
            <div className="w-16 h-0.5 bg-red-700 mx-auto mb-6" />
            <p className="text-gray-400 font-light max-w-2xl mx-auto">
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
                 <div className="bg-gray-200 aspect-[4/3] rounded-sm relative overflow-hidden shadow-sm">
                     <img 
                       src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000" 
                       alt="Ron's Guest House Berastagi - Kamar dan penginapan nyaman" 
                       className="w-full h-full object-cover opacity-90 grayscale-[20%]" 
                     />
                 </div>
                 {/* Text block */}
                 <div className="flex flex-col justify-center h-full pt-4">
                     <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 font-sans">Profile</h2>
                     <div className="space-y-6 text-gray-400 font-medium text-base md:text-lg leading-relaxed">
                         <p>Experience the luxury and charm of a premier guest house designed for travelers seeking both relaxation and adventure. Our property features thoughtfully appointed rooms and suites that cater to every need.</p>
                         <p>Whether you are visiting for a weekend getaway or an extended stay, our dedicated staff is here to ensure your experience is nothing short of exceptional. We take pride in our pristine accommodations and personalized service.</p>
                         <p>From the moment you arrive, you will understand why Ron's Guest House is considered a landmark destination in the beautiful highlands of North Sumatra.</p>
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
                     <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 font-sans">Our Story</h2>
                     <div className="space-y-6 text-gray-400 font-medium text-base md:text-lg leading-relaxed">
                         <p>Founded with a passion for hospitality, Ron's Guest House has grown from a humble resting place into a top-tier sanctuary for tourists visiting Berastagi. We believe in creating memorable experiences.</p>
                         <p>Every detail, from the contemporary architecture to the lush garden amenities, has been carefully selected to reflect our high standards of excellence and our deep respect for local culture.</p>
                         <p>Our commitment remains steadfast: providing an atmosphere where every guest feels like family, surrounded by the breathtaking views of the Karo highlands.</p>
                     </div>
                 </div>
                 {/* Image Placeholder */}
                 <div className="bg-gray-200 aspect-[4/3] rounded-sm relative overflow-hidden shadow-sm order-1 lg:order-2">
                     <img 
                       src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000" 
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
                 {/* Card 1 */}
                 <div className="bg-gray-400 aspect-[3/4] relative rounded-sm overflow-hidden group shadow-md cursor-pointer">
                     <img src="https://images.unsplash.com/photo-1570779815039-4aa81c3c3f2d?auto=format&fit=crop&q=80&w=600" alt="Bukit Gundaling Berastagi" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                     <div className="absolute bottom-0 left-0 p-6 w-full">
                         <h3 className="text-white font-black text-lg mb-1">Bukit Gundaling</h3>
                         <p className="text-gray-300 text-sm font-medium">Iconic volcano views</p>
                     </div>
                 </div>
                 {/* Card 2 */}
                 <div className="bg-gray-400 aspect-[3/4] relative rounded-sm overflow-hidden group shadow-md cursor-pointer">
                     <img src="https://images.unsplash.com/photo-1590074064562-b9e763845bfa?auto=format&fit=crop&q=80&w=600" alt="Pasar Buah Berastagi" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                     <div className="absolute bottom-0 left-0 p-6 w-full">
                         <h3 className="text-white font-black text-lg mb-1">Pasar Buah Berastagi</h3>
                         <p className="text-gray-300 text-sm font-medium">Fresh local produce</p>
                     </div>
                 </div>
                 {/* Card 3 */}
                 <div className="bg-gray-400 aspect-[3/4] relative rounded-sm overflow-hidden group shadow-md cursor-pointer">
                     <img src="https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&q=80&w=600" alt="Gunung Sibayak Berastagi wisata" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                     <div className="absolute bottom-0 left-0 p-6 w-full">
                         <h3 className="text-white font-black text-lg mb-1">Gunung Sibayak</h3>
                         <p className="text-gray-300 text-sm font-medium">Volcano trekking adventures</p>
                     </div>
                 </div>
                 {/* Card 4 */}
                 <div className="bg-gray-400 aspect-[3/4] relative rounded-sm overflow-hidden group shadow-md cursor-pointer">
                     <img src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=600" alt="Taman Alam Lumbini Berastagi" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                     <div className="absolute bottom-0 left-0 p-6 w-full">
                         <h3 className="text-white font-black text-lg mb-1">Taman Alam Lumbini</h3>
                         <p className="text-gray-300 text-sm font-medium">Breathtaking golden pagoda</p>
                     </div>
                 </div>
             </div>
         </ScrollReveal>
      </section>

      <PublicFooter />
    </div>
  );
}
