import { requireRole } from '../../lib/session';
import { AppShell } from '../../components/layout/AppShell';

export default async function VolunteerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['VOLUNTEER']);
  return <AppShell role="VOLUNTEER">{children}</AppShell>;
}
