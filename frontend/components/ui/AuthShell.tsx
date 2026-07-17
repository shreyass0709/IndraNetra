import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { copy } from '../../lib/copy';

/**
 * The centered card every auth screen sits in. No animated rings, no scanlines, no
 * rotating HUD overlays -- the old login page rendered four of those behind the form.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center text-xl font-semibold tracking-tight text-foreground"
        >
          {copy.app.name}
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

/** Error banner. Icon + text, never colour alone (REBUILD_SPEC.md §10). */
export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
