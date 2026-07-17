import { requireRole } from '../../lib/session';
import { AppShell } from '../../components/layout/AppShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: wrong role or signed-out is redirected here, before any child
  // page renders, so there is no flash of admin content.
  await requireRole(['ADMIN']);
  return <AppShell role="ADMIN">{children}</AppShell>;
}
