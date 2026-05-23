'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { apiFetch } from '@/lib/apiFetch';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  type: 'new_booking' | 'reminder' | 'payment_confirmed' | 'new_review';
  message: string;
  date: Date;
  read: boolean;
}

export interface ReservationToast {
  id: string;
  guestName: string;
  roomNumber: string;
  bookingCode: string;
  source: string;
  checkInDate: string;
}

export interface PaymentToast {
  id: string;
  guestName: string;
  roomNumber: string;
  bookingCode: string;
  amount: number;
  paymentMethod: string;
  confirmedAt: string;
}

export interface ReviewToast {
  id: string;
  displayName: string;
  rating: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  reservationBadge: number;
  unpaidTransactionsCount: number;
  readyToCheckInCount: number;
  reviewBadge: number;
  toasts: ReservationToast[];
  paymentToasts: PaymentToast[];
  reviewToasts: ReviewToast[];
  markAllRead: () => void;
  clearReservationBadge: () => void;
  clearReviewBadge: () => void;
  dismissToast: (id: string) => void;
  dismissPaymentToast: (id: string) => void;
  dismissReviewToast: (id: string) => void;
  fetchBadgeCounts: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  reservationBadge: 0,
  unpaidTransactionsCount: 0,
  readyToCheckInCount: 0,
  reviewBadge: 0,
  toasts: [],
  paymentToasts: [],
  reviewToasts: [],
  markAllRead: () => {},
  clearReservationBadge: () => {},
  clearReviewBadge: () => {},
  dismissToast: () => {},
  dismissPaymentToast: () => {},
  dismissReviewToast: () => {},
  fetchBadgeCounts: async () => {},
});

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const times = [0, 0.15, 0.3];
    const freqs = [880, 1100, 1320];
    times.forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + t);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.25);
    });
  } catch {
    // AudioContext not available (e.g. SSR)
  }
}

const STAFF_ROLES = ['admin', 'superadmin', 'receptionist'];

export function NotificationProvider({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reservationBadge, setReservationBadge] = useState(0);
  const [reviewBadge, setReviewBadge] = useState(0);
  const [toasts, setToasts] = useState<ReservationToast[]>([]);
  const [paymentToasts, setPaymentToasts] = useState<PaymentToast[]>([]);
  const [reviewToasts, setReviewToasts] = useState<ReviewToast[]>([]);
  const [unpaidTransactionsCount, setUnpaidTransactionsCount] = useState(0);
  const [readyToCheckInCount, setReadyToCheckInCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const addNotification = useCallback((notif: Notification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });
    setUnreadCount((c) => c + 1);
    if (notif.type === 'new_booking') {
      setReservationBadge((c) => c + 1);
    }
    if (notif.type === 'new_review') {
      setReviewBadge((c) => c + 1);
    }
  }, []);

  const fetchBadgeCounts = useCallback(async () => {
    if (!STAFF_ROLES.includes(role)) return;
    try {
      const res = await apiFetch('/reservations/utils/badge-counts');
      if (res.ok) {
        const data = await res.json();
        setUnpaidTransactionsCount(data.unpaidTransactionsCount ?? 0);
        setReadyToCheckInCount(data.readyToCheckInCount ?? 0);
        setReservationBadge(data.reservationBadgeCount ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch badge counts', err);
    }
  }, [role]);

  useEffect(() => {
    fetchBadgeCounts();
  }, [fetchBadgeCounts]);

  // Fetch H-1 reminders on mount
  useEffect(() => {
    if (!STAFF_ROLES.includes(role)) return;

    apiFetch('/reservations/utils/reminders')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        data.forEach((resv) => {
          addNotification({
            id: 'rem_' + resv.id,
            type: 'reminder',
            message: `Reminder H-1: ${resv.guest.fullName} akan check-in besok di kamar ${resv.room.roomNumber}`,
            date: new Date(),
            read: false,
          });
        });
      })
      .catch(() => {});
  }, [role, addNotification]);

  // Real-time Socket.io connection
  useEffect(() => {
    if (!STAFF_ROLES.includes(role)) return;

    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
      {
        path: '/api/socket.io',
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      },
    );
    socketRef.current = socket;

    const connectTimer = setTimeout(() => {
      if (socketRef.current) socketRef.current.connect();
    }, 300);

    socket.on('reservation_created', (data: any) => {
      const toastId = 'realtime_' + (data.id ?? Date.now());
      const guestName = data.guest?.fullName || 'Tamu';
      const roomNumber = data.room?.roomNumber || '-';
      const source = data.source ?? 'internal';
      const sourceLabel = source === 'online' ? 'Online' : 'Internal';

      addNotification({
        id: toastId,
        type: 'new_booking',
        message: `Reservasi baru [${sourceLabel}]: ${guestName} memesan kamar ${roomNumber}`,
        date: new Date(),
        read: false,
      });

      const toast: ReservationToast = {
        id: toastId,
        guestName,
        roomNumber,
        bookingCode: data.bookingCode ?? '-',
        source: sourceLabel,
        checkInDate: data.checkInDate ?? '',
      };
      setToasts((prev) => [...prev, toast]);
      playNotificationSound();
      fetchBadgeCounts();

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 8000);
    });

    socket.on('payment_confirmed', (data: any) => {
      const toastId = 'payment_' + (data.id ?? Date.now());
      const guestName = data.guestName || 'Tamu';
      const roomNumber = data.roomNumber || '-';

      addNotification({
        id: toastId,
        type: 'payment_confirmed',
        message: `Pembayaran dikonfirmasi: ${guestName} (Kamar ${roomNumber}) — ${data.bookingCode}`,
        date: new Date(),
        read: false,
      });

      const paymentToast: PaymentToast = {
        id: toastId,
        guestName,
        roomNumber,
        bookingCode: data.bookingCode ?? '-',
        amount: Number(data.amount ?? 0),
        paymentMethod: data.paymentMethod ?? 'transfer',
        confirmedAt: data.confirmedAt ?? new Date().toISOString(),
      };
      setPaymentToasts((prev) => [...prev, paymentToast]);
      playNotificationSound();
      fetchBadgeCounts();

      setTimeout(() => {
        setPaymentToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 10000);
    });

    socket.on('reservation_updated', () => {
      fetchBadgeCounts();
    });

    socket.on('reservation_deleted', () => {
      fetchBadgeCounts();
    });

    socket.on('new_review', (data: any) => {
      const toastId = 'review_' + (data.id ?? Date.now());
      addNotification({
        id: toastId,
        type: 'new_review',
        message: `Ulasan baru dari ${data.displayName || 'Tamu Anonim'} dengan rating ${data.rating} Bintang`,
        date: new Date(),
        read: false,
      });

      const reviewToast: ReviewToast = {
        id: toastId,
        displayName: data.displayName || 'Tamu Anonim',
        rating: data.rating || 5,
      };
      setReviewToasts((prev) => [...prev, reviewToast]);
      playNotificationSound();

      setTimeout(() => {
        setReviewToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 8000);
    });

    return () => {
      clearTimeout(connectTimer);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [role, addNotification]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearReservationBadge = useCallback(() => {
    setReservationBadge(0);
  }, []);

  const clearReviewBadge = useCallback(() => {
    setReviewBadge(0);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissPaymentToast = useCallback((id: string) => {
    setPaymentToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissReviewToast = useCallback((id: string) => {
    setReviewToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        reservationBadge,
        unpaidTransactionsCount,
        readyToCheckInCount,
        reviewBadge,
        toasts,
        paymentToasts,
        reviewToasts,
        markAllRead,
        clearReservationBadge,
        clearReviewBadge,
        dismissToast,
        dismissPaymentToast,
        dismissReviewToast,
        fetchBadgeCounts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
