'use client';

import PenaltyPageContent from '@/components/features/PenaltyPageContent';

export default function ReceptionistPenaltiesPage() {
  return <PenaltyPageContent canCreate canEdit={false} canDelete={false} />;
}
