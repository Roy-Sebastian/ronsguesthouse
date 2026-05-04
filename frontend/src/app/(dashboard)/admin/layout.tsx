import DashboardLayout from '@/components/layout/DashboardLayout';
import { NotificationProvider } from '@/providers/NotificationProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider role="admin">
      <DashboardLayout role="admin">{children}</DashboardLayout>
    </NotificationProvider>
  );
}
