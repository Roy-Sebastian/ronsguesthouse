'use client';

import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavbar from '@/components/layout/PublicNavbar';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Users, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { io } from 'socket.io-client';
import { useSearchParams } from 'next/navigation';

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
  imageUrls?: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800';

// ─── RoomCard Component ─────────────────────────────────────────────────────

function RoomCard({ room, backendUrl }: { room: Room; backendUrl: string }) {
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = useMemo(() => {
    if (room.imageUrls && room.imageUrls.length > 0) return room.imageUrls;
    if (room.imageUrl) return [room.imageUrl];
    return [];
  }, [room.imageUrls, room.imageUrl]);

  const currentDisplayUrl = useMemo(
    () => (images.length > 0 ? `${backendUrl}${images[currentIndex]}` : FALLBACK_IMAGE),
    [images, backendUrl, currentIndex],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const nextImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setCurrentIndex((prev) => (prev + 1) % images.length);
    },
    [images.length],
  );

  const prevImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    },
    [images.length],
  );

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="group bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full rounded-xl">
      {/* Image Carousel */}
      <div className="relative aspect-4/3 overflow-hidden bg-gray-100 group/carousel">
        <img
          src={currentDisplayUrl}
          alt={room.roomType}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Room Details */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-2xl font-serif text-gray-900 mb-2">
          {room.roomType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Room
        </h3>

        <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4 font-light">
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-1.5" /> {room.capacity} Guests
          </span>
        </div>

        {/* Room Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {room.roomAmenities?.slice(0, 4).map((ra: any) => (
            <span
              key={ra.amenity?.name}
              className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md border border-zinc-200 whitespace-nowrap font-medium"
            >
              {ra.amenity?.name}
            </span>
          ))}
          {room.roomAmenities?.length > 4 && (
            <span className="text-gray-500 uppercase tracking-widest text-xs font-bold inline-block mb-3 border-b border-red-800 pb-1">
              Guest House
            </span>
          )}
          {!room.roomAmenities?.length && (
            <span className="text-xs text-gray-400 italic">No specific amenities listed</span>
          )}
        </div>

        <p className="text-sm text-gray-600 font-light mb-6 line-clamp-2 flex-1">
          {room.description ||
            'Enjoy a luxurious stay with premium amenities designed for absolute comfort.'}
        </p>

        {/* Price & CTA */}
        <div className="pt-6 border-t border-gray-100 flex items-end justify-between mt-auto">
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500 block mb-1">
              Nightly Rate
            </span>
            <div className="text-xl font-serif text-gray-900">
              Rp {Number(room.pricePerNight).toLocaleString('id-ID')}
            </div>
          </div>
          <Link
            href="/search?checkIn=&checkOut="
            className="text-sm font-bold uppercase tracking-widest text-red-800 hover:text-black transition-colors flex items-center"
          >
            Check Availability <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── RoomsContent Component ─────────────────────────────────────────────────

function RoomsContent() {
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // ── Data Fetching & Socket ─────────────────────────────────────────────────

  const fetchRooms = useCallback(() => {
    fetch(`${backendUrl}/api/rooms`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          const filtered: Room[] = typeFilter
            ? d.filter((r: Room) => r.roomType === typeFilter)
            : d;
          const seen = new Set<string>();
          const deduped = filtered.filter((r) => {
            if (seen.has(r.roomType)) return false;
            seen.add(r.roomType);
            return true;
          });
          setRooms(deduped);
        } else {
          setRooms([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => {
    fetchRooms();

    let socket: any;
    try {
      socket = io(backendUrl, {
        path: '/api/socket.io',
        transports: ['polling'],
      });
      socket.on('room_booked', fetchRooms);
      socket.on('room_freed', fetchRooms);
    } catch (e) {
      /* socket connection failed silently */
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [fetchRooms, backendUrl]);

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50 text-gray-900 font-sans selection:bg-red-900 selection:text-white">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-white text-gray-900 pt-32 pb-20 px-4 border-b border-gray-100">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Accommodations</h1>
            <div className="w-16 h-0.5 bg-red-800 mx-auto mb-6" />
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              Find your perfect retreat. From cozy Standard rooms to elegant Suites with private balcony, each
              space is designed to elevate your stay.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Rooms List */}
      <section className="py-20 px-4 max-w-7xl mx-auto min-h-[50vh]">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-light text-xl border border-dashed border-gray-300">
            No rooms available matching your criteria at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <ScrollReveal key={room.id}>
                <RoomCard room={room} backendUrl={backendUrl} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function PublicRoomsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>
      }
    >
      <RoomsContent />
    </Suspense>
  );
}
