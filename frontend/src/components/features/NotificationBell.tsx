'use client';

import { useNotifications } from '@/providers/NotificationProvider';
import { Bell, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleOpen = () => {
    const next = !showDropdown;
    setShowDropdown(next);
    if (next) markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-400 hover:text-black transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] items-center justify-center flex rounded-full border-2 border-black">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase">
              Notifikasi
            </h3>
            <span className="text-xs text-gray-500">
              {notifications.length} Pesan
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Tidak ada notifikasi
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 ${!notif.read ? 'bg-white/5' : ''} hover:bg-white/10 transition-colors`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="mt-1 p-2 rounded-full bg-black border border-white/10">
                        {notif.type === 'payment_confirmed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <CalendarCheck className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-200 leading-snug">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.date).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
