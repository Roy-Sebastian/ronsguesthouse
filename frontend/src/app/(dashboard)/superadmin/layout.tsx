import DashboardLayout from '@/components/layout/DashboardLayout';
import { NotificationProvider } from '@/providers/NotificationProvider';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider role="superadmin">
      <DashboardLayout role="superadmin">{children}</DashboardLayout>
    </NotificationProvider>
  );
}
