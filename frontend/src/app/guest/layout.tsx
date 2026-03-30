import DashboardLayout from '@/components/layout/DashboardLayout';
import { NotificationProvider } from '@/providers/NotificationProvider';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider role="guest">
      <DashboardLayout role="guest">{children}</DashboardLayout>
    </NotificationProvider>
  );
}
