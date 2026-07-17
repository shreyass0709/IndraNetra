import { requireRole } from '../../lib/session';
import { AppShell } from '../../components/layout/AppShell';

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['ORGANIZER']);
  return <AppShell role="ORGANIZER">{children}</AppShell>;
}
