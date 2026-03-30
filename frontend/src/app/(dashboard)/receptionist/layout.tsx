import DashboardLayout from '@/components/layout/DashboardLayout';
import { NotificationProvider } from '@/providers/NotificationProvider';

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider role="receptionist">
      <DashboardLayout role="receptionist">{children}</DashboardLayout>
    </NotificationProvider>
  );
}
