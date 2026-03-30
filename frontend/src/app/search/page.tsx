'use client';

import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { BedDouble, Calendar, ChevronRight, ChevronLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { io } from 'socket.io-client';

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  pricePerNight: number;
  description: string;
  status: string;
  isFullyBooked?: boolean;
  roomAmenities: { amenity: { name: string } }[];
  imageUrl?: string;
  imageUrls?: string[];
}

interface GroupedRoomType {
  roomType: string;
  representative: Room;
  totalCount: number;
  availableCount: number;
  isFullyBooked: boolean;
  firstAvailableRoomId: string | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state
  const urlCheckIn = searchParams.get('checkIn') || '';
  const urlCheckOut = searchParams.get('checkOut') || '';
  
  // Local form state for the widget
  const [formCheckIn, setFormCheckIn] = useState(urlCheckIn);
  const [formCheckOut, setFormCheckOut] = useState(urlCheckOut);

  const [groupedRooms, setGroupedRooms] = useState<GroupedRoomType[]>([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // Calculate nights for form & display
  const calculateNights = (inDate: string, outDate: string) => {
    if (!inDate || !outDate) return 0;
    const diff = new Date(outDate).getTime() - new Date(inDate).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const nights = calculateNights(urlCheckIn, urlCheckOut);
  const totalNights = nights > 0 ? nights : 1; // Default to 1 night for price calculation if no dates picked

  useEffect(() => {
    const fetchRooms = () => {
      setLoading(true);
      let url = '/api/rooms';
      const params = new URLSearchParams();
      if (urlCheckIn) params.append('checkIn', urlCheckIn);
      if (urlCheckOut) params.append('checkOut', urlCheckOut);
      // We only want available rooms showing in the search results
      if (!urlCheckIn || !urlCheckOut) {
         // If no dates, maybe we show all available rooms? or require search. Let's fetch all available.
         params.append('status', 'available');
      }
      
      if (params.toString()) url += `?${params.toString()}`;

      fetch(url)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) {
            const groups: Record<string, GroupedRoomType> = {};
            
            d.forEach((room: Room) => {
              if (!groups[room.roomType]) {
                groups[room.roomType] = {
                  roomType: room.roomType,
                  representative: { ...room, imageUrls: [] },
                  totalCount: 0,
                  availableCount: 0,
                  isFullyBooked: true,
                  firstAvailableRoomId: null,
                };
              }
              
              const group = groups[room.roomType];

              if (room.imageUrl && !group.representative.imageUrls!.includes(room.imageUrl)) {
                group.representative.imageUrls!.push(room.imageUrl);
              }

              group.totalCount += 1;
              if (!room.isFullyBooked) {
                group.availableCount += 1;
                group.isFullyBooked = false; // At least one is available
                if (!group.firstAvailableRoomId) {
                  group.firstAvailableRoomId = room.id;
                }
              }
            });

            setGroupedRooms(Object.values(groups));
          } else {
            setGroupedRooms([]);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchRooms();

    let socket: any;
    try {
      socket = io(backendUrl, {
        path: '/api/socket.io',
        transports: ['polling'],
      });
      socket.on('room_booked', fetchRooms);
      socket.on('room_freed', fetchRooms);
    } catch (e) {}

    return () => {
      if (socket) socket.disconnect();
    };
  }, [urlCheckIn, urlCheckOut, backendUrl]);

  // Carousel State tracking map
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});

  const nextImage = (e: React.MouseEvent, type: string, length: number) => {
    e.preventDefault();
    setActiveImageIndices((prev) => ({
      ...prev,
      [type]: ((prev[type] || 0) + 1) % length
    }));
  };

  const prevImage = (e: React.MouseEvent, type: string, length: number) => {
    e.preventDefault();
    setActiveImageIndices((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) === 0 ? length - 1 : (prev[type] || 0) - 1
    }));
  };

  const handleSearchUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (formCheckIn) query.append('checkIn', formCheckIn);
    if (formCheckOut) query.append('checkOut', formCheckOut);
    router.push('/search?' + query.toString(), { scroll: false });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-gray-900 font-sans">
      <PublicNavbar />

      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-serif text-gray-900">Pilih ruangan yang paling sesuai untuk Anda</h1>
          {urlCheckIn && urlCheckOut && (
            <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600 border-b border-gray-200 pb-4 flex-wrap gap-y-2">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {new Date(urlCheckIn).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {new Date(urlCheckOut).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="text-gray-300">|</span>
              <span className="font-medium text-gray-800">{nights} Malam</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT SIDEBAR WIDGET */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 shadow-sm p-6 sticky top-24">
              <form onSubmit={handleSearchUpdate} className="space-y-6">
                
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Check-in</label>
                  <input 
                    type="date" 
                    required
                    value={formCheckIn}
                    onChange={(e) => setFormCheckIn(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-red-700 transition-colors text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Check-out</label>
                  <input 
                    type="date" 
                    required
                    value={formCheckOut}
                    onChange={(e) => setFormCheckOut(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-red-700 transition-colors text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="text-gray-600">Durasi:</span>
                  <span className="font-bold">{calculateNights(formCheckIn, formCheckOut)} Malam</span>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 uppercase tracking-wider text-sm transition-colors"
                >
                  Periksa ketersediaan
                </button>
              </form>
            </div>
          </div>

          {/* MAIN LISTINGS CONTENT */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
              </div>
            ) : groupedRooms.length === 0 ? (
              <div className="bg-white border border-gray-200 p-12 text-center text-gray-500">
                Kamar tidak tersedia untuk tanggal yang dipilih. Silakan coba tanggal lain.
              </div>
            ) : (
              groupedRooms.map((group) => {
                const room = group.representative;
                const images = room.imageUrls && room.imageUrls.length > 0 ? room.imageUrls : (room.imageUrl ? [room.imageUrl] : []);
                const currentImageIndex = activeImageIndices[room.roomType] || 0;
                const currentDisplayUrl = images.length > 0 ? `${backendUrl}${images[currentImageIndex]}` : 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800';

                return (
                <div 
                  key={group.roomType}
                  className="bg-white border border-gray-100 shadow-sm flex flex-col md:flex-row hover:shadow-md transition-shadow group/card"
                >
                  <div className="md:w-1/3 relative h-64 md:h-auto overflow-hidden shrink-0 group/carousel">
                    <img
                      src={currentDisplayUrl}
                      alt={room.roomType}
                      className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${group.isFullyBooked ? 'grayscale opacity-60' : ''}`}
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => prevImage(e, room.roomType, images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => nextImage(e, room.roomType, images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
                          {images.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold tracking-wider uppercase shadow-sm text-white ${group.isFullyBooked ? 'bg-gray-600' : group.availableCount <= 5 ? 'bg-red-700' : 'bg-green-700'}`}>
                      {group.isFullyBooked ? 'Full' : group.availableCount <= 5 ? 'Limited' : 'Available'}
                    </div>
                  </div>

                  {/* Info Column */}
                  <div className="p-6 md:w-2/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 flex-1">
                    <h2 className="text-xl font-serif font-semibold text-gray-900 mb-2 capitalize">{room.roomType}</h2>
                    
                    <div className="flex items-center text-xs text-gray-500 mb-3 space-x-4">
                      <span className="flex items-center"><BedDouble className="w-3.5 h-3.5 mr-1" /> Guest House</span>
                      <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1" /> Tamu maks: {room.capacity}</span>
                    </div>

                    <div className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {room.description || "Enjoy a luxurious stay with premium amenities designed for absolute comfort."}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.roomAmenities?.slice(0,4).map(ra => (
                        <span key={ra.amenity.name} className="flex items-center text-xs text-red-800 font-medium bg-red-50 px-2 py-1 rounded">
                          {ra.amenity.name}
                        </span>
                      ))}
                    </div>

                    <Link href={`/rooms`} className="text-sm font-semibold text-red-700 hover:text-red-900 transition-colors mt-auto flex items-center">
                      Lihat selengkapnya <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>

                  {/* Price Action Column */}
                  <div className="p-6 md:w-1/3 flex flex-col justify-center items-end bg-gray-50/50">
                    <div className="text-right mb-6">
                      <span className="text-xs text-gray-500 block mb-1">Mulai dari</span>
                      <span className="text-2xl font-bold text-gray-900 block mb-1">Rp {Number(room.pricePerNight).toLocaleString('id-ID')}</span>
                      <span className="text-xs text-gray-500">/ malam</span>
                    </div>

                    {group.isFullyBooked ? (
                      <button 
                        disabled
                        className="w-full bg-gray-200 text-gray-400 font-medium py-2.5 px-4 text-sm flex items-center justify-center uppercase tracking-widest cursor-not-allowed"
                      >
                        Tidak tersedia
                      </button>
                    ) : (
                      <div className="w-full">
                        {group.availableCount <= 5 ? (
                          <div className="text-xs text-red-700 font-bold text-center mb-2">
                            Tersisa {group.availableCount} kamar!
                          </div>
                        ) : (
                          <div className="text-xs text-green-700 font-bold text-center mb-2">
                            Tersedia
                          </div>
                        )}
                        <Link 
                          href={urlCheckIn && urlCheckOut ? `/book/${group.firstAvailableRoomId}?checkIn=${urlCheckIn}&checkOut=${urlCheckOut}` : `/book/${group.firstAvailableRoomId}`}
                          className="w-full text-center bg-red-700 hover:bg-red-800 text-white font-medium py-2.5 px-4 text-sm transition-colors flex items-center justify-center group uppercase tracking-widest"
                        >
                          Rincian & pesanan <ChevronRight className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </div>
                    )}
                  </div>

                </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
