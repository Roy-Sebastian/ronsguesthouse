'use client';

import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavbar from '@/components/layout/PublicNavbar';
import ScrollReveal from '@/components/ui/ScrollReveal';
import {
  BedDouble,
  ChevronRight,
  MapPin,
  Star,
  Users,
  Wifi,
  Coffee,
  Car,
  Shield,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL, FALLBACK_HERO_IMAGE } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  pricePerNight: number;
  description: string;
  status: string;
  roomAmenities: { amenity: { name: string } }[];
  imageUrl?: string;
}

interface Facility {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FALLBACK_REVIEWS = [
  { id: '1', rating: 5, comment: "Pengalaman menginap yang luar biasa! Pelayanan bersih dan nyaman.", guest: "Budi S.", room: "standard Room" },
  { id: '2', rating: 5, comment: "Sangat direkomendasikan. Lokasi strategis dan staf ramah.", guest: "Siti A.", room: "deluxe Room" },
  { id: '3', rating: 4, comment: "Fasilitas lengkap dan harga bersahabat. Recommended!", guest: "Agus P.", room: "family Room" },
  { id: '4', rating: 5, comment: "Nyaman seperti di rumah sendiri. Dekat dengan pusat kota.", guest: "Rina W.", room: "standard Room" },
  { id: '5', rating: 5, comment: "Kamar bersih dan wangi. Overall sangat memuaskan.", guest: "Dedi S.", room: "deluxe Room" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [heroImages, setHeroImages] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // ── Data Fetching & Socket ─────────────────────────────────────────────────

  const fetchRooms = useCallback(() => {
    fetch('/api/rooms')
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d)) return setRooms([]);
        
        // Group rooms by roomType to show only 1 representing each type in Featured
        const groupedRooms = d.reduce((acc: any, room: Room) => {
          if (!acc[room.roomType]) {
            acc[room.roomType] = room;
          }
          return acc;
        }, {});
        
        // Convert to array and slice
        setRooms(Object.values(groupedRooms).slice(0, 3) as Room[]);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchRooms();

    fetch('/api/gallery?category=hero&isActive=true')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setHeroImages(d);
        }
      })
      .catch(() => { });

    fetch('/api/facilities')
      .then((r) => r.json())
      .then((d) => setFacilities(Array.isArray(d) ? d : []))
      .catch(() => { });

    fetch('/api/public/reviews')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d) && d.length > 0) setReviews(d); })
      .catch(() => { });

    let socket: any;
    try {
      socket = io(window.location.origin, {
        path: '/api/socket.io',
        transports: ['polling'],
      });
      socket.on('room_booked', fetchRooms);
      socket.on('room_freed', fetchRooms);
    } catch (error) { }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [fetchRooms]);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // 5 seconds interval
    return () => clearInterval(interval);
  }, [heroImages]);

  // ── Handlers & Helpers ─────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (checkIn) query.append('checkIn', checkIn);
    if (checkOut) query.append('checkOut', checkOut);
    router.push('/search?' + query.toString());
  };

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('wifi')) return <Wifi className="w-8 h-8" />;
    if (n.includes('parkir') || n.includes('parking')) return <Car className="w-8 h-8" />;
    if (n.includes('kopi') || n.includes('coffee') || n.includes('cafe'))
      return <Coffee className="w-8 h-8" />;
    if (n.includes('aman') || n.includes('security')) return <Shield className="w-8 h-8" />;
    return <Clock className="w-8 h-8" />;
  };

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-red-900 selection:text-white">
      <PublicNavbar />

      {/* HERO SECTION - MARRIOTT STYLE */}
      <section className="relative w-full h-[85vh] min-h-150 flex flex-col justify-center items-center overflow-hidden bg-black">
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 z-20 pointer-events-none" />

        {/* Background Image Slider */}
        {heroImages.length > 0 ? (
          heroImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 w-full h-full bg-contain bg-no-repeat bg-center transition-opacity duration-1000 ease-in-out z-10 ${index === currentHeroIndex ? 'opacity-100' : 'opacity-0'}`}
              style={{
                backgroundImage: `url('${BACKEND_URL}${image.imageUrl}')`,
              }}
            />
          ))
        ) : (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center z-10"
            style={{
              backgroundImage: `url('${FALLBACK_HERO_IMAGE}')`,
            }}
          />
        )}
      </section>

      {/* FLOATING SEARCH BAR COMPONENT */}
      <div className="relative z-30 w-full px-4 md:px-0 -mt-16 md:-mt-12 mb-12">
        <form
          onSubmit={handleSearch}
          className="max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-2xl flex flex-col md:flex-row md:items-stretch rounded-2xl md:rounded-full overflow-hidden border border-gray-100"
        >
          {/* Destination */}
          <div className="flex-1 p-4 md:p-5 border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-colors cursor-text">
            <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-1">
              Destination
            </label>
            <div className="flex items-center text-gray-800 font-serif text-lg">
              <MapPin className="w-5 h-5 mr-2 text-red-800" />
              <input
                type="text"
                value="Ron's Guesthouse"
                readOnly
                className="bg-transparent outline-none w-full cursor-pointer"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="flex-1 p-4 md:p-5 border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-1">
                Check-in
              </label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="bg-transparent outline-none text-gray-800 font-serif text-lg w-full"
              />
            </div>
            <div className="hidden sm:block w-px h-full bg-gray-200" />
            <div className="flex-1">
              <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-1 mt-4 sm:mt-0">
                Check-out
              </label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="bg-transparent outline-none text-gray-800 font-serif text-lg w-full"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-secondary w-full md:w-auto px-8 py-4 md:py-5 md:min-w-[200px] uppercase tracking-widest text-sm font-bold rounded-none md:rounded-r-full"
          >
            Find Rooms
          </button>
        </form>
      </div>

      {/* FEATURED ROOMS SECTION */}
      <section className="py-20 px-4 max-w-7xl mx-auto bg-white">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4 inline-block border-t-4 border-red-800 pt-4">Featured Accommodations</h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <ScrollReveal key={room.id}>
              <div className="group cursor-pointer">
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden mb-4">
                  <img
                    src={room.imageUrl ? `${BACKEND_URL}${room.imageUrl}` : 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=800'}
                    alt={room.roomType}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <h3 className="text-2xl font-serif text-gray-900 mb-2 group-hover:text-red-800 transition-colors capitalize">
                  {room.roomType} Room
                </h3>

                <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4 font-light">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1.5" /> {room.capacity} Guests
                  </span>
                  <span className="flex items-center">
                    <BedDouble className="w-4 h-4 mr-1.5" /> {room.roomNumber}
                  </span>
                </div>

                <div className="flex items-end justify-between mt-6">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-gray-500">From</span>
                    <div className="text-xl font-serif text-gray-900">
                      Rp {Number(room.pricePerNight).toLocaleString('id-ID')} <span className="text-sm font-light text-gray-500">/night</span>
                    </div>
                  </div>
                  <Link
                    href={`/rooms?type=${room.roomType}`}
                    className="text-sm font-bold uppercase tracking-widest text-red-800 hover:text-black transition-colors flex items-center"
                  >
                    View Details <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}

          {rooms.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-300">
              No featured rooms available at the moment.
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/rooms"
            className="inline-block border border-black text-black hover:bg-black hover:text-white px-8 py-3 text-sm font-bold tracking-widest uppercase transition-all"
          >
            Explore All Rooms
          </Link>
        </div>
      </section>

      {/* EXPERIENCES / AMENITIES */}
      <section className="py-20 px-4 max-w-7xl mx-auto bg-white border-t border-gray-200">
        <ScrollReveal>
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4 inline-block border-t-4 border-red-800 pt-4">Our Facilities</h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {facilities.length > 0 ? facilities.map((fac) => (
            <ScrollReveal key={fac.id}>
              <div className="flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-lg aspect-square text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-red-800 mb-4">
                  {getIcon(fac.name)}
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 truncate w-full">{fac.name}</h4>
                <p className="text-xs text-gray-500 font-medium line-clamp-2">
                  {fac.description || "High-speed Internet"}
                </p>
              </div>
            </ScrollReveal>
          )) : (
            <div className="col-span-full py-8 text-center text-gray-500 italic">
              Facilities information is being updated.
            </div>
          )}
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="pt-20 pb-32 px-4 bg-gray-50 text-gray-900 relative overflow-hidden">
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}} />

        <ScrollReveal>
          <div className="max-w-7xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-serif mb-4 inline-block border-t-4 border-red-800 pt-4 text-gray-900">What Our Guests Say</h2>
          </div>
        </ScrollReveal>

        <div className="w-full relative overflow-hidden">
          <div className="flex w-max animate-marquee space-x-6 pb-4 cursor-pointer">
            {[...(reviews.length > 0 ? reviews : FALLBACK_REVIEWS), ...(reviews.length > 0 ? reviews : FALLBACK_REVIEWS)].map((review, index) => (
              <div key={index} className="w-[300px] md:w-[350px] p-6 bg-white border border-gray-200 hover:border-gray-300 shadow-sm rounded-lg flex flex-col h-full transition-all text-left flex-shrink-0 whitespace-normal">
                <div className="flex justify-start mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 mr-1 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}`}
                    />
                  ))}
                </div>

                <div className="w-16 h-16 rounded-full bg-gray-100 mb-4 shrink-0 flex items-center justify-center font-bold text-gray-400 text-xl">
                  {review.guest?.charAt(0)}
                </div>

                <div className="mt-auto">
                  <h4 className="text-sm font-bold text-gray-900 mb-1 truncate font-serif">
                    {review.guest}
                  </h4>
                  <div className="text-xs text-red-800 font-bold uppercase tracking-widest mb-3">{review.room}</div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCOVER MORE SECTION */}
      <section className="py-20 px-4 max-w-7xl mx-auto bg-white border-t border-gray-100">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Left Content */}
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-serif text-gray-900 mb-6 max-w-md leading-tight">
                Discover More About Ron's Guest House
              </h2>
              <p className="text-gray-500 font-light mb-10 max-w-lg leading-relaxed text-sm">
                Experience the pinnacle of luxury, where our world-class service combined with breathtaking views creates a stay to remember.
              </p>
              <a
                href="https://wa.me/628127573588"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-full transition-colors text-sm font-bold uppercase tracking-widest shadow-md"
              >
                <div className="fa fa-heart cursor-pointer">

                </div>
                <span>Contact Us</span>
              </a>
            </div>

            {/* Right Map */}
            <div className="flex-1 w-full relative aspect-square md:aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shadow-inner border border-gray-200">
              <iframe
                src="https://maps.google.com/maps?width=100%25&height=600&hl=en&q=Jl.%20Perwira%20Gg.%20Kaliaga%20No.5,%20Gundaling%20I,%20Kec.%20Berastagi,%20Kabupaten%20Karo,%20Sumatera%20Utara%2022156+(Ron's%20Guest%20House)&t=&z=15&ie=UTF8&iwloc=B&output=embed"
                className="w-full h-full border-0 absolute inset-0 grayscale-[50%] hover:grayscale-0 transition-all duration-500"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ron's Guest House Location Map"
              ></iframe>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <PublicFooter />
    </div>
  );
}
