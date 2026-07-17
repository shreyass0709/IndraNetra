'use client';

// Real route for the emergency module. The shared dashboard body derives which
// section to render from the URL (see tabForPath in dashboard/utils.ts);
// role access is gated by canAccessPath before this ever renders.
import DashboardPage from '../dashboard/page';

export default function Page() {
  return <DashboardPage />;
}
