'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  type: 'new_booking' | 'reminder';
  message: string;
  date: Date;
  read: boolean;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  reservationBadge: number;
  markAllRead: () => void;
  clearReservationBadge: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  reservationBadge: 0,
  markAllRead: () => {},
  clearReservationBadge: () => {},
});

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
  }, []);

  // Fetch H-1 reminders on mount
  useEffect(() => {
    if (!STAFF_ROLES.includes(role)) return;

    fetch('/api/reservations/utils/reminders')
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

  // Single shared Socket.io connection
  useEffect(() => {
    if (!STAFF_ROLES.includes(role)) return;

    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
      { path: '/api/socket.io', autoConnect: true },
    );
    socketRef.current = socket;

    socket.on('reservation_created', (data: any) => {
      if (data?.source !== 'online') return;
      addNotification({
        id: 'realtime_' + (data.id ?? Date.now()),
        type: 'new_booking',
        message: `Pesanan online baru: ${data.guest?.fullName || 'Tamu'} memesan kamar ${data.room?.roomNumber || '-'}`,
        date: new Date(),
        read: false,
      });
    });

    return () => {
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

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        reservationBadge,
        markAllRead,
        clearReservationBadge,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
