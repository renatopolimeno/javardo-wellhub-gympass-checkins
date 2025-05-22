import { CheckInStatusDisplay } from '@/components/CheckInStatusDisplay';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Status do Check-in - WellPass AutoCheck',
  description: 'Veja o resultado da sua tentativa de check-in.',
};

export default function CheckInStatusPage() {
  return <CheckInStatusDisplay />;
}
