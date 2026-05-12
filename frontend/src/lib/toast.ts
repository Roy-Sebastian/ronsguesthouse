export type ToastType = 'success' | 'error' | 'info';

export interface ToastPayload {
  message: string;
  title?: string;
  type: ToastType;
  id: number;
}

/**
 * Fire a toast notification from anywhere — no context/provider needed.
 * DashboardLayout listens for this event and renders the toast.
 */
export const showToast = (message: string, type: ToastType = 'success', title?: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>('app-toast', {
      detail: { message, type, title, id: Date.now() },
    }),
  );
};
