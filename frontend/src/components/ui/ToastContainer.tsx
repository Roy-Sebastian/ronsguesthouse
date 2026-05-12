'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import type { ToastPayload } from '@/lib/toast';

const ICON = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
};

const STYLE = {
  success: 'border-l-[3px] border-green-500  bg-white text-gray-800',
  error:   'border-l-[3px] border-red-500    bg-white text-gray-800',
  info:    'border-l-[3px] border-blue-500   bg-white text-gray-800',
};

const ICON_COLOR = {
  success: 'text-green-500',
  error:   'text-red-500',
  info:    'text-blue-400',
};

const PROGRESS = {
  success: 'bg-green-400',
  error:   'bg-red-400',
  info:    'bg-blue-400',
};

interface Toast extends ToastPayload { exiting?: boolean }

const DURATION = 3000;

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type, title, id } = (e as CustomEvent<ToastPayload>).detail;
      setToasts((p) => [...p, { message, type, title, id }]);

      setTimeout(() => {
        setToasts((p) => p.map((t) => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
      }, DURATION);
    };

    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  const dismiss = (id: number) => {
    setToasts((p) => p.map((t) => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 w-72 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = ICON[toast.type];
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto rounded-xl shadow-lg overflow-hidden
              ${STYLE[toast.type]}
              transition-all duration-350
              ${toast.exiting
                ? 'opacity-0 translate-x-8'
                : 'opacity-100 translate-x-0 animate-slideInRight'
              }
            `}
          >
            {/* Content row */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Icon size={18} className={`shrink-0 ${ICON_COLOR[toast.type]}`} />
              <span className="flex-1 text-sm font-medium leading-snug">
                {toast.message}
              </span>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors ml-1"
              >
                <X size={14} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-[3px] bg-gray-100">
              <div
                className={`h-full origin-left ${PROGRESS[toast.type]}`}
                style={{ animation: `shrink ${DURATION}ms linear forwards` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
