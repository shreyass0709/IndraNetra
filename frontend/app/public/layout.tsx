import { requireRole } from '../../lib/session';
import { AppShell } from '../../components/layout/AppShell';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['PUBLIC']);
  return <AppShell role="PUBLIC">{children}</AppShell>;
}
