'use client';

import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavbar from '@/components/layout/PublicNavbar';
import ScrollReveal from '@/components/ui/ScrollReveal';
import {
  ChevronRight,
  MapPin,
  Search,
  Star,
  Users,
  Wifi,
  Coffee,
  Car,
  Shield,
  Clock,
  AirVent, Bath, Bed, BookOpen, Building2, Bus, Dumbbell, Flame,
  Lightbulb, Lock, type LucideIcon, Music, Package, Phone, Plug,
  Refrigerator, ShowerHead, Shirt, Snowflake, Sofa, Sun, Trees, Tv,
  Utensils, Waves, Wind, Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  roomAmenities: { amenity: { name: string; icon?: string | null } }[];
  imageUrl?: string;
}

const AMENITY_ICON_MAP: Record<string, LucideIcon> = {
  Wifi, Tv, AirVent, Bath, ShowerHead, Coffee, Refrigerator, Phone, Plug,
  Lightbulb, Sofa, Bed, Lock, Wind, Shirt, Flame, Snowflake, Waves, Car,
  Dumbbell, Utensils, Building2, Trees, Sun, Shield, Bus, Music, BookOpen,
  Package, Star, Wrench,
};

function AmenityIcon({ icon, size = 14 }: { icon?: string | null; size?: number }) {
  const Icon = (icon && AMENITY_ICON_MAP[icon] ? AMENITY_ICON_MAP[icon] : Wrench) as LucideIcon;
  return <Icon size={size} />;
}

interface Facility {
  id: string;
  name: string;
  description: string;
  icon: string;
}

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
  const [bookingCode, setBookingCode] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch { /* fallback */ }
    }
    el.focus();
    el.click();
  };

  // ── Data Fetching & Socket ─────────────────────────────────────────────────

  const fetchRooms = useCallback(() => {
    fetch(`${BACKEND_URL}/api/rooms`)
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
        setRooms(Object.values(groupedRooms).slice(0, 4) as Room[]);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchRooms();

    fetch(`${BACKEND_URL}/api/gallery?category=hero&isActive=true`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setHeroImages(d);
        }
      })
      .catch(() => { });

    fetch(`${BACKEND_URL}/api/facilities`)
      .then((r) => r.json())
      .then((d) => setFacilities(Array.isArray(d) ? d : []))
      .catch(() => { });

    fetch(`${BACKEND_URL}/api/public/reviews`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d) && d.length > 0) setReviews(d); })
      .catch(() => { });

    const socket = io(window.location.origin, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
    });
    socket.on('room_booked', fetchRooms);
    socket.on('room_freed', fetchRooms);

    return () => {
      socket.disconnect();
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

  const handleCheckBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const code = bookingCode.trim().toUpperCase();
    if (!code) return;
    router.push(`/check-booking?code=${encodeURIComponent(code)}`);
  };

  const FACILITY_NAME_ICON_MAP: Record<string, LucideIcon> = {
    wifi: Wifi, internet: Wifi,
    parkir: Car, parking: Car,
    kopi: Coffee, coffee: Coffee, cafe: Coffee, breakfast: Coffee,
    aman: Shield, security: Shield, keamanan: Shield,
    tv: Tv, television: Tv,
    shower: ShowerHead, mandi: ShowerHead,
    ac: AirVent, aircon: AirVent,
    heater: Flame, pemanas: Flame, 'water heater': Flame,
    kulkas: Refrigerator, fridge: Refrigerator, refrigerator: Refrigerator,
    laundry: Shirt, cucian: Shirt,
    gym: Dumbbell, fitness: Dumbbell,
    restaurant: Utensils, makan: Utensils, dining: Utensils,
    garden: Trees, taman: Trees,
    pool: Waves, kolam: Waves,
    bath: Bath, bathtub: Bath,
    bed: Bed, kasur: Bed,
    sofa: Sofa, lounge: Sofa,
    music: Music,
    phone: Phone, telepon: Phone,
    lock: Lock, kunci: Lock,
    sun: Sun, rooftop: Sun,
    wind: Wind, kipas: Wind,
    plug: Plug, listrik: Plug, charger: Plug,
    bus: Bus, shuttle: Bus, transport: Bus,
    building: Building2,
    book: BookOpen, perpustakaan: BookOpen,
  };

  const getFacilityIcon = (fac: Facility): LucideIcon => {
    // 1. Try the icon field from the database (matches AMENITY_ICON_MAP keys like "Wifi", "Tv", etc.)
    if (fac.icon && AMENITY_ICON_MAP[fac.icon]) {
      return AMENITY_ICON_MAP[fac.icon];
    }

    // 2. Fall back to name-based matching
    const n = fac.name.toLowerCase();
    for (const [keyword, icon] of Object.entries(FACILITY_NAME_ICON_MAP)) {
      if (n.includes(keyword)) return icon;
    }

    // 3. Default
    return Coffee;
  };

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-red-900 selection:text-white">
      <PublicNavbar />

      {/* HERO SECTION - MARRIOTT STYLE */}
      <section className="relative w-full h-[85vh] min-h-[500px] flex flex-col justify-center items-center overflow-hidden bg-black">
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 z-20 pointer-events-none" />

        {/* Hero Central Content & Badge */}
        <div className="absolute z-30 flex flex-col items-center pointer-events-none drop-shadow-xl text-center px-4">
          <ScrollReveal>
            <h1 className="text-4xl md:text-6xl font-serif text-white font-bold tracking-tight mb-2 drop-shadow-2xl">
              Ron's Guest House
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-white/90 text-lg md:text-xl font-light tracking-wide mb-8 drop-shadow-md">
              Classic elegance meets modern luxury
            </p>
          </ScrollReveal>

          {/* Booking.com Badge */}
          {/* <a
            href="https://www.booking.com/hotel/id/rons-guest-house-berastagi.id.html?aid=318615&label=English_Indonesia_EN_ID_28546570705-G6blYurG1wv5nxy_NQuKzQS634117825086%3Apl%3Ata%3Ap1%3Ap2%3Aac%3Aap%3Aneg%3Afi%3Atidsa-209721654025%3Alp9121598%3Ali%3Adec%3Adm%3Aag28546570705%3Acmp340122265&sid=f5fc3dbbcbe7885739a87ec632ac344d&dest_id=-2673007&dest_type=city&dist=0&group_adults=2&group_children=0&hapos=1&hpos=1&no_rooms=1&req_adults=2&req_children=0&room1=A%2CA&sb_price_type=total&sr_order=popularity&srepoch=1775286493&srpvid=e26e322a608600cc&type=total&ucfs=1&"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto group inline-flex items-center gap-4 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl p-2 pr-6 transition-all duration-300 shadow-2xl hover:scale-105"
          >
            <div className="bg-[#003580] text-white font-bold text-2xl px-4 py-2 rounded-xl flex items-center justify-center shadow-inner">
              9.5
            </div>
            <div className="flex flex-col text-left">
              <span className="text-white font-bold text-sm tracking-widest uppercase">Exceptional</span>
              <span className="text-white/70 text-xs font-medium">Verified by Booking.com</span>
            </div>
          </a> */}
        </div>

        {/* Background Image Slider */}
        {heroImages.length > 0 ? (
          heroImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out z-10 ${index === currentHeroIndex ? 'opacity-100' : 'opacity-0'}`}
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
        <ScrollReveal delay={400}>
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
            <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => openPicker(checkInRef)}
                className="flex-1 text-left p-4 md:p-5 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:bg-gray-50"
              >
                <span className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-1">
                  Check-in
                </span>
                <input
                  ref={checkInRef}
                  type="date"
                  required
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent outline-none text-gray-800 font-serif text-lg w-full cursor-pointer"
                />
              </button>
              <div className="hidden sm:block w-px bg-gray-200" />
              <button
                type="button"
                onClick={() => openPicker(checkOutRef)}
                className="flex-1 text-left p-4 md:p-5 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:bg-gray-50"
              >
                <span className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-1">
                  Check-out
                </span>
                <input
                  ref={checkOutRef}
                  type="date"
                  required
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent outline-none text-gray-800 font-serif text-lg w-full cursor-pointer"
                />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-secondary w-full md:w-auto px-8 py-4 md:py-5 md:min-w-[200px] uppercase tracking-widest text-sm font-bold rounded-none md:rounded-r-full"
            >
              Find Rooms
            </button>
          </form>
        </ScrollReveal>
      </div>



      {/* FEATURED ROOMS SECTION */}
      <section className="py-20 px-4 max-w-7xl mx-auto bg-white">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4 inline-block border-t-4 border-red-800 pt-4">Featured Accommodations</h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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

                <h3 className="text-xl font-serif text-gray-900 mb-2 group-hover:text-red-800 transition-colors">
                  {room.roomType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Room
                </h3>

                <div className="flex items-center text-sm text-gray-500 mb-3 font-light">
                  <Users className="w-4 h-4 mr-1.5" /> {room.capacity} Guests
                </div>

                {room.roomAmenities?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {room.roomAmenities.slice(0, 4).map((ra: any) => (
                      <span
                        key={ra.amenity?.name}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md border border-zinc-200"
                      >
                        <AmenityIcon icon={ra.amenity?.icon} />
                        {ra.amenity?.name}
                      </span>
                    ))}
                  </div>
                )}
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
                  {(() => { const Icon = getFacilityIcon(fac); return <Icon className="w-8 h-8" />; })()}
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
      {reviews.length > 0 && (
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
            <div className={`flex ${reviews.length >= 3 ? 'w-max animate-marquee' : 'justify-center w-full'} space-x-6 pb-4 cursor-pointer`}>
              {(reviews.length >= 3 ? [...reviews, ...reviews] : reviews).map((review, index) => (
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
      )}

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
