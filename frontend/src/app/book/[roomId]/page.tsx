'use client';

import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { apiFetch } from '@/lib/apiFetch';
import { BACKEND_URL, FALLBACK_ROOM_IMAGE } from '@/lib/constants';
import { calculateDays } from '@/lib/formatters';
import { ChevronRight, ArrowLeft, CheckCircle2, User, FileText, CreditCard, BedDouble, Loader2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  pricePerNight: number;
  description: string;
  imageUrl?: string;
  roomAmenities: { amenity: { name: string } }[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BookingPage() {
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const roomId = params.roomId as string;
  const checkInQuery = searchParams.get('checkIn');
  const checkOutQuery = searchParams.get('checkOut');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    checkIn: checkInQuery || '',
    checkOut: checkOutQuery || '',
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    specialRequests: '',
  });

  const totalNights = calculateDays(formData.checkIn, formData.checkOut);
  const totalPrice = room ? totalNights * Number(room.pricePerNight) : 0;

  // ── Data Fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    apiFetch(`/rooms/${roomId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setRoom(d);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load room data");
        setLoading(false);
      });
  }, [roomId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 1) {
      if (!formData.guestName || !formData.guestPhone || !formData.guestEmail) {
        toast.error("Please complete guest details (Name, Email, and Phone)");
        return;
      }
      if (!formData.checkIn || !formData.checkOut) {
        toast.error("Please fill in Check-in and Check-out dates");
        return;
      }

      const inDate = new Date(formData.checkIn);
      const outDate = new Date(formData.checkOut);
      if (inDate >= outDate) {
        toast.error("Check-out date must be after Check-in");
        return;
      }
    }
    setStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitBooking = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch('/public/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          checkIn: new Date(formData.checkIn).toISOString(),
          checkOut: new Date(formData.checkOut).toISOString(),
          guestName: formData.guestName,
          guestPhone: formData.guestPhone,
          guestEmail: formData.guestEmail,
          specialRequests: formData.specialRequests || undefined,
          numGuests: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      const snap = (window as any).snap;
      if (!snap) {
        toast.error('Snap belum dimuat. Silakan refresh halaman.');
        setSubmitting(false);
        return;
      }

      snap.pay(data.payment.token, {
        onSuccess: async (_result: any) => {
          // Force manual backend synchronization (useful for localhost testing without webhook)
          try {
             await apiFetch(`/transactions/midtrans/sync/${_result.order_id}`);
          } catch(e) {}

          setBookingCode(data.bookingCode);
          setStep(4);
          toast.success('Payment successful! Your booking has been confirmed.');
          setSubmitting(false);
        },
        onPending: async (_result: any) => {
          setBookingCode(data.bookingCode);
          setStep(4);
          toast.success('Booking created! Awaiting payment confirmation.');
          setSubmitting(false);
        },
        onError: (_result: any) => {
          toast.error('Payment failed. Please try again.');
          setSubmitting(false);
        },
        onClose: () => {
          toast('You closed the payment window. Your booking is saved — you can pay later.', { icon: 'ℹ️' });
          setSubmitting(false);
        },
      });
    } catch (error: any) {
      toast.error(error.message);
      setSubmitting(false);
    }
  };

  // ── JSX ────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
    </div>
  );

  if (!room) return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-serif mb-4">Room Not Found</h1>
      <button onClick={() => router.push('/rooms')} className="text-red-800 hover:underline">
        Back to Rooms
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-gray-900 font-sans">
      <PublicNavbar />
      
      <div className="pt-32 pb-20 px-4 max-w-5xl mx-auto">
        <button 
          onClick={() => step > 1 ? handleBack() : router.back()} 
          className="flex items-center text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step > 1 ? 'Back' : 'Back to Rooms'}
        </button>

        {/* Stepper Header */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-12 border-b border-gray-200 pb-8">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-red-800' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 1 ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-100'}`}>
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-center">Guest Info</span>
            </div>
            
            <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-red-800' : 'bg-gray-200'}`} />
            
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-red-800' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 2 ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-100'}`}>
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-center">Booking Details</span>
            </div>

            <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-red-800' : 'bg-gray-200'}`} />
            
            <div className={`flex flex-col items-center ${step >= 3 ? 'text-red-800' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 3 ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-100'}`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-center">Payment</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* STEP 1: GUEST INFO */}
            {step === 1 && (
              <div className="bg-white p-8 border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-serif mb-6 text-gray-900 border-b border-gray-100 pb-4">Guest Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Check-in</label>
                    <input 
                      type="date" 
                      value={formData.checkIn}
                      onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                      className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-red-800 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Check-out</label>
                    <input 
                      type="date" 
                      value={formData.checkOut}
                      onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                      className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-red-800 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Full Name *</label>
                    <input
                      type="text"
                      placeholder="As per ID / Passport"
                      value={formData.guestName}
                      onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                      className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-red-800 transition-colors"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Email Address *</label>
                      <input 
                        type="email" 
                        value={formData.guestEmail}
                        onChange={(e) => setFormData({...formData, guestEmail: e.target.value})}
                        className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-red-800 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Phone / WhatsApp *</label>
                      <input 
                        type="tel" 
                        value={formData.guestPhone}
                        onChange={(e) => setFormData({...formData, guestPhone: e.target.value})}
                        className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-red-800 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Special Requests (Optional)</label>
                    <textarea
                      rows={3}
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                      className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-red-800 transition-colors"
                      placeholder="e.g. Please prepare an extra bed..."
                    />
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button onClick={handleNext} className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors">
                    Continue to Review
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: BOOKING DETAILS */}
            {step === 2 && (
              <div className="bg-white p-8 border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-serif mb-6 text-gray-900 border-b border-gray-100 pb-4">Booking Details</h2>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Room</span>
                    <span className="font-serif text-xl capitalize">{room.roomType} Room</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Check-in</span>
                    <span className="text-lg text-gray-800">
                      {new Date(formData.checkIn).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Check-out</span>
                    <span className="text-lg text-gray-800">
                      {new Date(formData.checkOut).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Duration</span>
                    <span className="text-lg text-gray-800">{totalNights} Nights</span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Guest Name</span>
                    <span className="text-lg text-gray-800">{formData.guestName}</span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Email</span>
                    <span className="text-lg text-gray-800">{formData.guestEmail}</span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Phone No.</span>
                    <span className="text-lg text-gray-800">{formData.guestPhone}</span>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button onClick={handleNext} className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors">
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT — Midtrans Snap */}
            {step === 3 && (
              <div className="bg-white p-8 border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-serif mb-6 text-gray-900 border-b border-gray-100 pb-4">Payment</h2>

                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-50 text-red-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif mb-3 text-gray-900">Online Payment via Midtrans</h3>
                  <p className="text-gray-500 font-light max-w-md mx-auto mb-8">
                    Click the button below to create your booking and open the payment page.
                    You can pay via bank transfer, e-wallet, QRIS, credit card, and more.
                  </p>

                  <button
                    onClick={handleSubmitBooking}
                    disabled={submitting}
                    className="bg-red-800 hover:bg-red-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-10 py-4 text-sm font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-3"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm & Pay Now'
                    )}
                  </button>

                  <p className="text-xs text-gray-400 mt-4">
                    Payment processed securely by Midtrans
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: CONFIRMATION */}
            {step === 4 && (
              <div className="bg-white p-12 border border-gray-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-serif mb-4 text-gray-900">Booking Confirmed!</h2>
                <p className="text-gray-500 font-light max-w-md mx-auto mb-6">
                  Thank you for choosing Ron&apos;s Guesthouse. Your booking details have been received.
                </p>

                {bookingCode && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg max-w-sm mx-auto p-6 mb-8 mt-2">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Save Your Booking Code</p>
                    <div className="font-mono text-2xl font-bold text-red-800 tracking-wider">
                      {bookingCode}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Use this code to track your order at the <Link href="/check-booking" className="text-red-800 hover:underline font-medium">Check Booking</Link> page.</p>
                  </div>
                )}

                <Link href="/" className="inline-block bg-black hover:bg-gray-800 text-white px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors">
                  Back to Home
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          {step < 4 && (
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-100 shadow-sm p-6 sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-100 pb-2">Booking Summary</h3>
                
                <div className="relative aspect-video bg-gray-100 mb-4 overflow-hidden rounded-sm">
                  <img
                    src={room.imageUrl ? `${BACKEND_URL}${room.imageUrl}` : FALLBACK_ROOM_IMAGE}
                    alt={room.roomType}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <h4 className="text-xl font-serif capitalize mb-1">{room.roomType} Room</h4>
                <p className="text-sm text-gray-500 flex items-center mb-6">
                  <BedDouble className="w-4 h-4 mr-1.5" /> Guest House
                </p>

                <div className="space-y-3 border-b border-gray-100 pb-6 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price per night</span>
                    <span className="font-medium text-gray-900">Rp {Number(room.pricePerNight).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total nights</span>
                    <span className="font-medium text-gray-900">{totalNights} Nights</span>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Payment</span>
                  <span className="text-2xl font-serif text-red-800">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
